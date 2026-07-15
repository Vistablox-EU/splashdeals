"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/(server)/lib/prisma";
import { revalidatePath } from "next/cache";
import { handleServerActionError, type ActionResult } from "@/app/(server)/lib/server-action-error";
import { MAX_QUANTITY_PER_ITEM, type CartItem, type CartItemInput } from "@/lib/types/cart";
import {
  applyGuestCartCookie,
  resolveCartPrincipal,
  type CartPrincipal,
} from "@/app/(server)/lib/cart-principal";
import { GUEST_CART_TTL_MS } from "@/app/(server)/lib/guest-cart-token";

// ─── DB-backed Rate Limiting ─────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_CALLS = 30; // max 30 mutations per minute
const TRANSACTION_MAX_ATTEMPTS = 3;
const CART_LOCKED_ERROR = "Plaćanje je u toku. Otkažite ga pre izmene korpe.";

type CartDbClient = Pick<
  Prisma.TransactionClient,
  "cartSession" | "cartSessionItem" | "ticketPrice"
>;

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

  throw new Error("Transakcija korpe nije uspela.");
}

async function checkRateLimit(principalKey: string): Promise<boolean> {
  return withSerializableRetry(async (tx) => {
    const now = new Date();
    const entry = await tx.cartRateLimit.findUnique({ where: { principalKey } });
    if (!entry || now > entry.resetAt) {
      await tx.cartRateLimit.upsert({
        where: { principalKey },
        create: {
          principalKey,
          callCount: 1,
          resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS),
        },
        update: { callCount: 1, resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS) },
      });
      return true;
    }
    if (entry.callCount >= RATE_LIMIT_MAX_CALLS) return false;
    await tx.cartRateLimit.update({
      where: { principalKey },
      data: { callCount: { increment: 1 } },
    });
    return true;
  });
}

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const addToCartSchema = z.object({
  ticketPriceId: z.string().uuid(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
});

const removeFromCartSchema = z.object({
  itemId: z.string().min(1),
});

const updateCartQuantitySchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(0).max(MAX_QUANTITY_PER_ITEM),
});

// ─── Plain Object Serializer ────────────────────────────────────────────────

/**
 * Converts a Prisma CartSessionItem to the CartItem interface used by the client.
 * CUID ids are passed through as-is (no uuid check needed).
 */
function toCartItem(item: {
  id: string;
  ticketPriceId: string;
  quantity: number;
  title: string;
  price: number;
  currency: string;
  facilityId: string;
  facilityName: string | null;
  category: string | null;
  validityType: string | null;
  requiresIdentity: boolean;
  requiresPhoto: boolean;
  imageUrl: string | null;
  minPeople: number | null;
  maxPeople: number | null;
  updatedAt: Date;
}): CartItem {
  return {
    id: item.id,
    ticketId: item.ticketPriceId,
    quantity: item.quantity,
    title: item.title,
    price: item.price,
    currency: item.currency,
    facilityId: item.facilityId,
    facilityName: item.facilityName ?? undefined,
    category: item.category ?? undefined,
    validityType: item.validityType ?? undefined,
    requiresIdentity: item.requiresIdentity,
    requiresPhoto: item.requiresPhoto,
    imageUrl: item.imageUrl,
    minPeople: item.minPeople ?? undefined,
    maxPeople: item.maxPeople ?? undefined,
    updatedAt: item.updatedAt.getTime(),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getOrCreateCartSession(principal: CartPrincipal, db: CartDbClient = prisma) {
  if (principal.type === "user") {
    return db.cartSession.upsert({
      where: { userId: principal.userId },
      create: { userId: principal.userId },
      update: {},
    });
  }

  if (principal.type === "guest") {
    if (principal.cartId) {
      const existing = await db.cartSession.findUnique({ where: { id: principal.cartId } });
      if (existing) {
        return db.cartSession.update({
          where: { id: existing.id },
          data: { expiresAt: new Date(Date.now() + GUEST_CART_TTL_MS) },
        });
      }
    }

    const existingByHash = await db.cartSession.findUnique({
      where: { guestTokenHash: principal.guestTokenHash },
    });
    if (existingByHash) {
      return db.cartSession.update({
        where: { id: existingByHash.id },
        data: { expiresAt: new Date(Date.now() + GUEST_CART_TTL_MS) },
      });
    }

    return db.cartSession.create({
      data: {
        guestTokenHash: principal.guestTokenHash,
        expiresAt: new Date(Date.now() + GUEST_CART_TTL_MS),
      },
    });
  }

  throw new Error("Korpa nije dostupna.");
}

async function getCartSession(principal: CartPrincipal, db: CartDbClient = prisma) {
  if (principal.type === "user") {
    return db.cartSession.findUnique({ where: { userId: principal.userId } });
  }
  if (principal.type === "guest") {
    if (principal.cartId) {
      return db.cartSession.findUnique({ where: { id: principal.cartId } });
    }
    return db.cartSession.findUnique({ where: { guestTokenHash: principal.guestTokenHash } });
  }
  return null;
}

async function incrementCartVersion(db: CartDbClient, cart: { id: string; version: number }) {
  const updated = await db.cartSession.updateMany({
    where: { id: cart.id, version: cart.version, locked: false },
    data: { version: { increment: 1 } },
  });
  if (updated.count !== 1) {
    throw new Error("Korpa je izmenjena. Pokušajte ponovo.");
  }
}

async function getCanonicalTicket(ticketPriceId: string, db: CartDbClient = prisma) {
  const ticketPrice = await db.ticketPrice.findUnique({
    where: { id: ticketPriceId },
    include: {
      ticketType: {
        include: {
          category: { include: { facility: true } },
        },
      },
    },
  });

  const now = new Date();
  if (
    !ticketPrice ||
    !ticketPrice.isActive ||
    !ticketPrice.ticketType.isActive ||
    !ticketPrice.ticketType.category.isActive ||
    ticketPrice.ticketType.category.facility.status !== "ACTIVE" ||
    (ticketPrice.validFrom && ticketPrice.validFrom > now) ||
    (ticketPrice.validTo && ticketPrice.validTo < now) ||
    (ticketPrice.saleStart && ticketPrice.saleStart > now) ||
    (ticketPrice.saleEnd && ticketPrice.saleEnd < now)
  ) {
    return null;
  }

  return ticketPrice;
}

/**
 * Reads cart items from the relational CartSessionItem table.
 */
async function readCartItems(cartId: string): Promise<CartItem[]> {
  const items = await prisma.cartSessionItem.findMany({
    where: { cartId },
    orderBy: { createdAt: "asc" },
  });
  return items.map(toCartItem);
}

// ─── Server Actions ─────────────────────────────────────────────────────────

export async function addToCartAction(
  input: CartItemInput,
): Promise<ActionResult<{ item: CartItem }>> {
  try {
    const data = addToCartSchema.parse(input);

    const principal = await resolveCartPrincipal({ createGuestIfMissing: true });
    if (principal.type === "anonymous" || !principal.rateLimitKey) {
      return { success: false, error: "Korpa trenutno nije dostupna." };
    }
    await applyGuestCartCookie(principal);

    if (!(await checkRateLimit(principal.rateLimitKey))) {
      return { success: false, error: "Previše zahteva. Pokušajte ponovo za minut." };
    }

    const result = await withSerializableRetry(async (tx) => {
      const ticketPrice = await getCanonicalTicket(data.ticketPriceId, tx);
      if (!ticketPrice) {
        return { success: false, error: "Izabrana karta više nije dostupna." } as const;
      }

      const ticketType = ticketPrice.ticketType;
      const facility = ticketType.category.facility;
      const minimumQuantity = Math.max(1, ticketType.minPeople);
      const maximumQuantity = Math.min(
        ticketType.maxPeople ?? MAX_QUANTITY_PER_ITEM,
        MAX_QUANTITY_PER_ITEM,
      );

      if (data.quantity < minimumQuantity || data.quantity > maximumQuantity) {
        return {
          success: false,
          error: `Dozvoljena količina za ovu kartu je od ${minimumQuantity} do ${maximumQuantity}.`,
        } as const;
      }

      const cartSession = await getOrCreateCartSession(principal, tx);
      if (cartSession.locked) {
        return { success: false, error: CART_LOCKED_ERROR } as const;
      }

      const differentFacilityItem = await tx.cartSessionItem.findFirst({
        where: {
          cartId: cartSession.id,
          facilityId: { not: facility.id },
        },
      });
      if (differentFacilityItem) {
        return {
          success: false,
          error: "U jednoj korpi možete imati karte samo za jedan objekat.",
        } as const;
      }

      const existing = await tx.cartSessionItem.findUnique({
        where: {
          cartId_ticketPriceId: {
            cartId: cartSession.id,
            ticketPriceId: data.ticketPriceId,
          },
        },
      });

      const canonicalData = {
        facilityId: facility.id,
        title: `${facility.name} - ${ticketType.title}${ticketPrice.label ? ` (${ticketPrice.label})` : ""}`,
        price: Number(ticketPrice.price),
        currency: "RSD",
        facilityName: facility.name,
        category: facility.category,
        validityType: ticketType.validityType,
        requiresIdentity: ticketType.requiresIdentity,
        requiresPhoto: ticketType.requiresPhoto,
        imageUrl: ticketType.imageUrl,
        minPeople: minimumQuantity,
        maxPeople: ticketType.maxPeople,
      };

      if (existing) {
        const newQty = existing.quantity + data.quantity;
        if (newQty > maximumQuantity) {
          return {
            success: false,
            error: `Maksimalna količina za ovu kartu je ${maximumQuantity}.`,
          } as const;
        }
        const updated = await tx.cartSessionItem.update({
          where: { id: existing.id },
          data: { ...canonicalData, quantity: newQty },
        });
        await incrementCartVersion(tx, cartSession);
        return { success: true, data: { item: toCartItem(updated) } } as const;
      }

      const created = await tx.cartSessionItem.create({
        data: {
          cartId: cartSession.id,
          ticketPriceId: data.ticketPriceId,
          quantity: data.quantity,
          ...canonicalData,
        },
      });
      await incrementCartVersion(tx, cartSession);

      return { success: true, data: { item: toCartItem(created) } } as const;
    });

    if (result.success) revalidatePath("/cart");
    return result;
  } catch (error) {
    return handleServerActionError(error, "addToCart");
  }
}

export async function getCartAction(): Promise<ActionResult<{ items: CartItem[] }>> {
  try {
    const principal = await resolveCartPrincipal({ createGuestIfMissing: false });
    if (principal.type === "anonymous") {
      return { success: true, data: { items: [] } };
    }

    const cartSession = await getCartSession(principal);
    const items = cartSession ? await readCartItems(cartSession.id) : [];

    return { success: true, data: { items } };
  } catch (error) {
    return handleServerActionError(error, "getCart");
  }
}

export async function removeFromCartAction(
  input: z.infer<typeof removeFromCartSchema>,
): Promise<ActionResult<{ removed: boolean }>> {
  try {
    const { itemId } = removeFromCartSchema.parse(input);

    const principal = await resolveCartPrincipal({ createGuestIfMissing: false });
    if (principal.type === "anonymous" || !principal.rateLimitKey) {
      return { success: false, error: "Korpa nije pronađena." };
    }

    if (!(await checkRateLimit(principal.rateLimitKey))) {
      return { success: false, error: "Previše zahteva. Pokušajte ponovo za minut." };
    }

    const result = await withSerializableRetry(async (tx) => {
      const cartSession = await getCartSession(principal, tx);
      if (!cartSession) {
        return { success: false, error: "Stavka nije pronađena u vašoj korpi." } as const;
      }
      if (cartSession.locked) {
        return { success: false, error: CART_LOCKED_ERROR } as const;
      }

      const deleted = await tx.cartSessionItem.deleteMany({
        where: { id: itemId, cartId: cartSession.id },
      });
      if (deleted.count === 0) {
        return { success: false, error: "Stavka nije pronađena u vašoj korpi." } as const;
      }

      const versionUpdated = await tx.cartSession.updateMany({
        where: { id: cartSession.id, version: cartSession.version, locked: false },
        data: { version: { increment: 1 } },
      });
      if (versionUpdated.count !== 1) {
        throw new Error("Korpa je izmenjena. Pokušajte ponovo.");
      }

      return { success: true, data: { removed: true } } as const;
    });

    if (result.success) revalidatePath("/cart");
    return result;
  } catch (error) {
    return handleServerActionError(error, "removeFromCart");
  }
}

export async function updateCartQuantityAction(
  input: z.infer<typeof updateCartQuantitySchema>,
): Promise<ActionResult<{ item: CartItem } | { cleared: boolean }>> {
  try {
    const { itemId, quantity } = updateCartQuantitySchema.parse(input);

    const principal = await resolveCartPrincipal({ createGuestIfMissing: false });
    if (principal.type === "anonymous" || !principal.rateLimitKey) {
      return { success: false, error: "Korpa nije pronađena." };
    }

    if (!(await checkRateLimit(principal.rateLimitKey))) {
      return { success: false, error: "Previše zahteva. Pokušajte ponovo za minut." };
    }

    const result = await withSerializableRetry(async (tx) => {
      const cartSession = await getCartSession(principal, tx);
      if (!cartSession) {
        return { success: false, error: "Stavka nije pronađena u vašoj korpi." } as const;
      }
      if (cartSession.locked) {
        return { success: false, error: CART_LOCKED_ERROR } as const;
      }

      const ownedItem = await tx.cartSessionItem.findFirst({
        where: { id: itemId, cartId: cartSession.id },
      });
      if (!ownedItem) {
        return { success: false, error: "Stavka nije pronađena u vašoj korpi." } as const;
      }

      if (quantity <= 0) {
        await tx.cartSessionItem.deleteMany({
          where: { id: itemId, cartId: cartSession.id },
        });
        await incrementCartVersion(tx, cartSession);
        return { success: true, data: { cleared: true } } as const;
      }

      const minimumQuantity = Math.max(1, ownedItem.minPeople ?? 1);
      const maximumQuantity = Math.min(
        ownedItem.maxPeople ?? MAX_QUANTITY_PER_ITEM,
        MAX_QUANTITY_PER_ITEM,
      );
      if (quantity < minimumQuantity || quantity > maximumQuantity) {
        return {
          success: false,
          error: `Dozvoljena količina za ovu kartu je od ${minimumQuantity} do ${maximumQuantity}.`,
        } as const;
      }

      const updated = await tx.cartSessionItem.update({
        where: { id: itemId, cartId: cartSession.id },
        data: { quantity },
      });
      await incrementCartVersion(tx, cartSession);
      return { success: true, data: { item: toCartItem(updated) } } as const;
    });

    if (result.success) revalidatePath("/cart");
    return result;
  } catch (error) {
    return handleServerActionError(error, "updateCartQuantity");
  }
}

/**
 * Reconciles cart line items against live ticket prices/availability.
 * Removes unavailable tickets and updates changed prices so /cart notices can fire.
 */
export async function reconcileCartAction(): Promise<
  ActionResult<{ items: CartItem[]; removedItems: string[]; changedItems: string[] }>
> {
  try {
    const principal = await resolveCartPrincipal({ createGuestIfMissing: false });
    if (principal.type === "anonymous") {
      return { success: true, data: { items: [], removedItems: [], changedItems: [] } };
    }

    const result = await withSerializableRetry(async (tx) => {
      const cartSession = await getCartSession(principal, tx);
      if (!cartSession) {
        return {
          items: [] as CartItem[],
          removedItems: [] as string[],
          changedItems: [] as string[],
        };
      }

      // Do not mutate a locked cart mid-checkout; just return current snapshot.
      if (cartSession.locked) {
        const lockedItems = await tx.cartSessionItem.findMany({
          where: { cartId: cartSession.id },
          orderBy: { createdAt: "asc" },
        });
        return {
          items: lockedItems.map(toCartItem),
          removedItems: [] as string[],
          changedItems: [] as string[],
        };
      }

      const storedItems = await tx.cartSessionItem.findMany({
        where: { cartId: cartSession.id },
        orderBy: { createdAt: "asc" },
      });

      const removedItems: string[] = [];
      const changedItems: string[] = [];
      let mutated = false;

      for (const item of storedItems) {
        const ticketPrice = await getCanonicalTicket(item.ticketPriceId, tx);
        if (!ticketPrice) {
          await tx.cartSessionItem.delete({ where: { id: item.id } });
          removedItems.push(item.title);
          mutated = true;
          continue;
        }

        const livePrice = Number(ticketPrice.price);
        if (livePrice !== item.price) {
          await tx.cartSessionItem.update({
            where: { id: item.id },
            data: { price: livePrice },
          });
          changedItems.push(item.title);
          mutated = true;
        }
      }

      if (mutated) {
        await incrementCartVersion(tx, cartSession);
      }

      const nextItems = await tx.cartSessionItem.findMany({
        where: { cartId: cartSession.id },
        orderBy: { createdAt: "asc" },
      });

      return {
        items: nextItems.map(toCartItem),
        removedItems,
        changedItems,
      };
    });

    if (result.removedItems.length > 0 || result.changedItems.length > 0) {
      revalidatePath("/cart");
    }

    return { success: true, data: result };
  } catch (error) {
    return handleServerActionError(error, "reconcileCart");
  }
}

export async function clearCartAction(): Promise<ActionResult<{ cleared: boolean }>> {
  try {
    const principal = await resolveCartPrincipal({ createGuestIfMissing: false });
    if (principal.type === "anonymous" || !principal.rateLimitKey) {
      return { success: true, data: { cleared: true } };
    }

    if (!(await checkRateLimit(principal.rateLimitKey))) {
      return { success: false, error: "Previše zahteva. Pokušajte ponovo za minut." };
    }

    const result = await withSerializableRetry(async (tx) => {
      const cartSession = await getCartSession(principal, tx);
      if (!cartSession) {
        return { success: true, data: { cleared: true } } as const;
      }
      if (cartSession.locked) {
        return { success: false, error: CART_LOCKED_ERROR } as const;
      }

      await tx.cartSessionItem.deleteMany({
        where: { cartId: cartSession.id },
      });
      await incrementCartVersion(tx, cartSession);
      return { success: true, data: { cleared: true } } as const;
    });

    if (result.success) revalidatePath("/cart");
    return result;
  } catch (error) {
    return handleServerActionError(error, "clearCart");
  }
}
