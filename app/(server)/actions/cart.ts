"use server";

import { z } from "zod";
import { prisma } from "@/app/(server)/lib/prisma";
import { auth } from "@/app/(server)/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { handleServerActionError, type ActionResult } from "@/app/(server)/lib/server-action-error";
import { MAX_QUANTITY_PER_ITEM, type CartItem } from "@/lib/types/cart";

// ─── DB-backed Rate Limiting ─────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_CALLS = 30; // max 30 mutations per minute

async function checkRateLimit(userId: string): Promise<boolean> {
  const now = new Date();
  try {
    const entry = await prisma.cartRateLimit.findUnique({ where: { userId } });
    if (!entry || now > entry.resetAt) {
      await prisma.cartRateLimit.upsert({
        where: { userId },
        create: { userId, callCount: 1, resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS) },
        update: { callCount: 1, resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS) },
      });
      return true;
    }
    if (entry.callCount >= RATE_LIMIT_MAX_CALLS) return false;
    await prisma.cartRateLimit.update({
      where: { userId },
      data: { callCount: { increment: 1 } },
    });
    return true;
  } catch {
    // If rate limit table doesn't exist yet (migration pending), allow the request
    return true;
  }
}

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const addToCartSchema = z.object({
  ticketPriceId: z.string().uuid(),
  facilityId: z.string().uuid(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
  title: z.string().min(1),
  price: z.number().positive(),
  currency: z.string().default("RSD"),
  facilityName: z.string().optional(),
  category: z.string().optional(),
  validityType: z.string().optional(),
  requiresIdentity: z.boolean().optional(),
  requiresPhoto: z.boolean().optional(),
  imageUrl: z.string().nullable().optional(),
  minPeople: z.number().int().optional(),
  maxPeople: z.number().int().nullable().optional(),
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

async function getOrCreateCartSession(userId: string) {
  let session = await prisma.cartSession.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!session) {
    session = await prisma.cartSession.create({
      data: { userId },
    });
  }

  return session;
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
  input: z.infer<typeof addToCartSchema>,
): Promise<ActionResult<{ item: CartItem }>> {
  try {
    const data = addToCartSchema.parse(input);

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni da biste dodali u korpu." };
    }

    if (!checkRateLimit(session.user.id)) {
      return { success: false, error: "Previše zahteva. Pokušajte ponovo za minut." };
    }

    // Check if cart is locked
    const cartSession = await getOrCreateCartSession(session.user.id);
    if (cartSession.locked) {
      const lockedAt = cartSession.lockedAt;
      if (lockedAt && Date.now() - lockedAt.getTime() < 300_000) {
        // Locked within last 5 minutes — reject
        return { success: false, error: "Checkout je u toku. Sačekajte da se završi." };
      }
      // Lock expired (5+ min) — auto-unlock
      await prisma.cartSession.update({
        where: { id: cartSession.id },
        data: { locked: false, lockedAt: null },
      });
    }

    // Check for existing item with same ticket + facility
    const existing = await prisma.cartSessionItem.findFirst({
      where: {
        cartId: cartSession.id,
        ticketPriceId: data.ticketPriceId,
        facilityId: data.facilityId,
      },
    });

    if (existing) {
      const newQty = Math.min(existing.quantity + data.quantity, MAX_QUANTITY_PER_ITEM);
      const updated = await prisma.cartSessionItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
      revalidatePath("/cart");
      return { success: true, data: { item: toCartItem(updated) } };
    }

    const created = await prisma.cartSessionItem.create({
      data: {
        cartId: cartSession.id,
        ticketPriceId: data.ticketPriceId,
        facilityId: data.facilityId,
        quantity: data.quantity,
        title: data.title,
        price: data.price,
        currency: data.currency,
        facilityName: data.facilityName ?? null,
        category: data.category ?? null,
        validityType: data.validityType ?? null,
        requiresIdentity: data.requiresIdentity ?? false,
        requiresPhoto: data.requiresPhoto ?? false,
        imageUrl: data.imageUrl ?? null,
        minPeople: data.minPeople ?? null,
        maxPeople: data.maxPeople ?? null,
      },
    });

    revalidatePath("/cart");
    return { success: true, data: { item: toCartItem(created) } };
  } catch (error) {
    return handleServerActionError(error, "addToCart");
  }
}

export async function getCartAction(): Promise<ActionResult<{ items: CartItem[] }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: true, data: { items: [] } };
    }

    const cartSession = await getOrCreateCartSession(session.user.id);
    const items = await readCartItems(cartSession.id);

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

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    if (!checkRateLimit(session.user.id)) {
      return { success: false, error: "Previše zahteva. Pokušajte ponovo za minut." };
    }

    // Verify ownership: item must belong to this user's cart
    await prisma.cartSessionItem.deleteMany({
      where: {
        id: itemId,
        cart: { userId: session.user.id },
      },
    });

    revalidatePath("/cart");
    return { success: true, data: { removed: true } };
  } catch (error) {
    return handleServerActionError(error, "removeFromCart");
  }
}

export async function updateCartQuantityAction(
  input: z.infer<typeof updateCartQuantitySchema>,
): Promise<ActionResult<{ item: CartItem } | { cleared: boolean }>> {
  try {
    const { itemId, quantity } = updateCartQuantitySchema.parse(input);

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    if (!checkRateLimit(session.user.id)) {
      return { success: false, error: "Previše zahteva. Pokušajte ponovo za minut." };
    }

    if (quantity <= 0) {
      // Remove item
      await prisma.cartSessionItem.deleteMany({
        where: {
          id: itemId,
          cart: { userId: session.user.id },
        },
      });
      revalidatePath("/cart");
      return { success: true, data: { cleared: true } };
    }

    const updated = await prisma.cartSessionItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    revalidatePath("/cart");
    return { success: true, data: { item: toCartItem(updated) } };
  } catch (error) {
    return handleServerActionError(error, "updateCartQuantity");
  }
}

export async function clearCartAction(): Promise<ActionResult<{ cleared: boolean }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    const cartSession = await prisma.cartSession.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    if (cartSession) {
      // Delete all items for this cart session
      await prisma.cartSessionItem.deleteMany({
        where: { cartId: cartSession.id },
      });
      // Reset cart session state
      await prisma.cartSession.update({
        where: { id: cartSession.id },
        data: { locked: false, lockedAt: null },
      });
    }

    revalidatePath("/cart");
    return { success: true, data: { cleared: true } };
  } catch (error) {
    return handleServerActionError(error, "clearCart");
  }
}

/**
 * 🔒 Lock or unlock a user's cart session.
 * Called by checkout.ts to prevent concurrent mutations during checkout.
 * Lock auto-expires after 5 minutes (TTL checked in addToCartAction).
 */
export async function setCartLockAction(
  locked: boolean,
): Promise<ActionResult<{ locked: boolean }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "You must be logged in." };
    }

    const cartSession = await prisma.cartSession.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    if (cartSession) {
      await prisma.cartSession.update({
        where: { id: cartSession.id },
        data: { locked, lockedAt: locked ? new Date() : null },
      });
    }

    return { success: true, data: { locked } };
  } catch (error) {
    return handleServerActionError(error, "setCartLock");
  }
}
