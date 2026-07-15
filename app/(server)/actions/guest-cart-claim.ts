"use server";

import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/app/(server)/lib/auth";
import { prisma } from "@/app/(server)/lib/prisma";
import { handleServerActionError, type ActionResult } from "@/app/(server)/lib/server-action-error";
import { decideGuestCartClaim } from "@/app/(server)/lib/guest-cart-claim";
import { clearGuestCartCookie } from "@/app/(server)/lib/cart-principal";
import { hashGuestCartToken, GUEST_CART_COOKIE_NAME } from "@/app/(server)/lib/guest-cart-token";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const TRANSACTION_MAX_ATTEMPTS = 3;

async function withSerializableRetry<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= TRANSACTION_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.code === "P2002");
      if (!retryable || attempt === TRANSACTION_MAX_ATTEMPTS) throw error;
    }
  }
  throw new Error("Preuzimanje korpe nije uspelo.");
}

function summarizeCart(cart: {
  id: string;
  cartItems: Array<{ facilityId: string; facilityName: string | null; quantity: number }>;
}) {
  const itemCount = cart.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const first = cart.cartItems[0];
  return {
    id: cart.id,
    facilityId: first?.facilityId ?? null,
    facilityName: first?.facilityName ?? first?.facilityId ?? null,
    itemCount,
  };
}

export type ClaimGuestCartResult =
  | { action: "claim"; cartId: string }
  | { action: "keep_user"; cartId: string }
  | { action: "merge"; cartId: string }
  | {
      action: "conflict";
      guestCartId: string;
      userCartId: string;
      guestFacilityId: string;
      userFacilityId: string;
    }
  | { action: "noop" };

export async function claimGuestCartAction(): Promise<ActionResult<ClaimGuestCartResult>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    const cookieStore = await cookies();
    const rawToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;
    if (!rawToken) {
      return { success: true, data: { action: "noop" } };
    }

    const guestTokenHash = hashGuestCartToken(rawToken);

    const result = await withSerializableRetry(async (tx) => {
      const [guestCart, userCart] = await Promise.all([
        tx.cartSession.findUnique({
          where: { guestTokenHash },
          include: {
            cartItems: { select: { facilityId: true, facilityName: true, quantity: true } },
          },
        }),
        tx.cartSession.findUnique({
          where: { userId: session.user.id },
          include: {
            cartItems: { select: { facilityId: true, facilityName: true, quantity: true } },
          },
        }),
      ]);

      const guestSummary = guestCart ? summarizeCart(guestCart) : null;
      const userSummary = userCart ? summarizeCart(userCart) : null;
      const decision = decideGuestCartClaim({
        guestCart: guestSummary,
        userCart: userSummary,
      });

      if (decision.action === "noop") {
        return decision;
      }

      if (decision.action === "keep_user") {
        if (guestCart) {
          await tx.cartSessionItem.deleteMany({ where: { cartId: guestCart.id } });
          await tx.cartSession.delete({ where: { id: guestCart.id } });
        }
        return decision;
      }

      if (decision.action === "claim" && guestCart) {
        await tx.cartSession.update({
          where: { id: guestCart.id },
          data: {
            userId: session.user.id,
            guestTokenHash: null,
            expiresAt: null,
          },
        });
        return decision;
      }

      if (decision.action === "merge" && guestCart && userCart) {
        const guestItems = await tx.cartSessionItem.findMany({ where: { cartId: guestCart.id } });
        for (const guestItem of guestItems) {
          const existing = await tx.cartSessionItem.findUnique({
            where: {
              cartId_ticketPriceId: {
                cartId: userCart.id,
                ticketPriceId: guestItem.ticketPriceId,
              },
            },
          });
          if (existing) {
            const maxQuantity = Math.min(existing.maxPeople ?? 50, 50);
            const nextQuantity = Math.min(existing.quantity + guestItem.quantity, maxQuantity);
            await tx.cartSessionItem.update({
              where: { id: existing.id },
              data: { quantity: nextQuantity },
            });
          } else {
            await tx.cartSessionItem.create({
              data: {
                cartId: userCart.id,
                ticketPriceId: guestItem.ticketPriceId,
                quantity: guestItem.quantity,
                title: guestItem.title,
                price: guestItem.price,
                currency: guestItem.currency,
                facilityId: guestItem.facilityId,
                facilityName: guestItem.facilityName,
                category: guestItem.category,
                validityType: guestItem.validityType,
                requiresIdentity: guestItem.requiresIdentity,
                requiresPhoto: guestItem.requiresPhoto,
                imageUrl: guestItem.imageUrl,
                minPeople: guestItem.minPeople,
                maxPeople: guestItem.maxPeople,
              },
            });
          }
        }
        await tx.cartSessionItem.deleteMany({ where: { cartId: guestCart.id } });
        await tx.cartSession.delete({ where: { id: guestCart.id } });
        await tx.cartSession.update({
          where: { id: userCart.id },
          data: { version: { increment: 1 } },
        });
        return { action: "merge", cartId: userCart.id } satisfies ClaimGuestCartResult;
      }

      if (decision.action === "conflict") {
        return {
          action: "conflict" as const,
          guestCartId: decision.guestCartId,
          userCartId: decision.userCartId,
          guestFacilityId: guestSummary?.facilityName || decision.guestFacilityId,
          userFacilityId: userSummary?.facilityName || decision.userFacilityId,
        };
      }

      return { action: "noop" } satisfies ClaimGuestCartResult;
    });

    if (result.action !== "conflict") {
      await clearGuestCartCookie();
    }

    revalidatePath("/cart");
    return { success: true, data: result };
  } catch (error) {
    return handleServerActionError(error, "claimGuestCart");
  }
}

export async function resolveGuestCartConflictAction(input: {
  choice: "guest" | "user";
}): Promise<ActionResult<{ cartId: string }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    const cookieStore = await cookies();
    const rawToken = cookieStore.get(GUEST_CART_COOKIE_NAME)?.value;
    if (!rawToken) {
      return { success: false, error: "Gostujuća korpa nije pronađena." };
    }
    const guestTokenHash = hashGuestCartToken(rawToken);

    const cartId = await withSerializableRetry(async (tx) => {
      const guestCart = await tx.cartSession.findUnique({
        where: { guestTokenHash },
      });
      const userCart = await tx.cartSession.findUnique({
        where: { userId: session.user.id },
      });
      if (!guestCart || !userCart) {
        throw new Error("Korpe za rešavanje konflikta nisu pronađene.");
      }
      if (guestCart.locked || userCart.locked) {
        throw new Error("Plaćanje je u toku. Otkažite ga pre izmene korpe.");
      }

      if (input.choice === "guest") {
        await tx.cartSessionItem.deleteMany({ where: { cartId: userCart.id } });
        await tx.cartSession.delete({ where: { id: userCart.id } });
        await tx.cartSession.update({
          where: { id: guestCart.id },
          data: {
            userId: session.user.id,
            guestTokenHash: null,
            expiresAt: null,
          },
        });
        return guestCart.id;
      }

      await tx.cartSessionItem.deleteMany({ where: { cartId: guestCart.id } });
      await tx.cartSession.delete({ where: { id: guestCart.id } });
      return userCart.id;
    });

    await clearGuestCartCookie();
    revalidatePath("/cart");
    return { success: true, data: { cartId } };
  } catch (error) {
    return handleServerActionError(error, "resolveGuestCartConflict");
  }
}
