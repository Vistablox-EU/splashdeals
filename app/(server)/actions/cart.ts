"use server";

import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { handleServerActionError, type ActionResult } from "@/server/lib/server-action-error";
import { MAX_QUANTITY_PER_ITEM, type CartItem } from "@/lib/types/cart";

// ─── Rate Limiting ───────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_CALLS = 30; // max 30 mutations per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_CALLS) return false;
  entry.count++;
  return true;
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

// ─── Helpers ────────────────────────────────────────────────────────────────

const generateItemId = (ticketId: string, facilityId?: string) => {
  return `${ticketId}-${facilityId || "unknown"}`;
};

function readCartItems(session: { items: unknown }): CartItem[] {
  return (session.items as CartItem[]) ?? [];
}

function toJsonItems(items: CartItem[]): Prisma.InputJsonValue {
  return items as unknown as Prisma.InputJsonValue;
}

/**
 * Checks if the cart is locked and returns an error if so.
 */
async function assertCartNotLocked(
  userId: string,
): Promise<{ success: false; error: string } | null> {
  const cartSession = await prisma.cartSession.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (cartSession?.locked) {
    return { success: false, error: "Naplata je već u toku. Sačekajte da se završi." };
  }
  return null;
}

async function getOrCreateCartSession(userId: string) {
  let session = await prisma.cartSession.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!session) {
    session = await prisma.cartSession.create({
      data: { userId, items: [] },
    });
  }

  return session;
}

// ─── Server Actions ─────────────────────────────────────────────────────────

export async function addToCartAction(
  input: z.infer<typeof addToCartSchema>,
): Promise<ActionResult<{ item: CartItem }>> {
  try {
    const data = addToCartSchema.parse(input);

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni da biste dodali stavku u korpu." };
    }

    // ⏱ Rate limit check
    if (!checkRateLimit(session.user.id)) {
      return { success: false, error: "Previše zahteva. Sačekajte trenutak." };
    }

    // 🔒 Cart lock check
    const lockError = await assertCartNotLocked(session.user.id);
    if (lockError) return lockError;

    // Validate ticket and facility
    const ticketPrice = await prisma.ticketPrice.findUnique({
      where: { id: data.ticketPriceId },
      include: {
        ticketType: {
          include: {
            category: {
              include: { facility: true },
            },
          },
        },
      },
    });

    if (!ticketPrice || !ticketPrice.isActive) {
      return { success: false, error: "Izabrana ulaznica nije dostupna." };
    }

    const facility = ticketPrice.ticketType.category.facility;
    if (facility.status !== "ACTIVE") {
      return { success: false, error: "Objekat trenutno nije aktivan." };
    }

    if (facility.id !== data.facilityId) {
      return { success: false, error: "Ulaznica ne pripada izabranom objektu." };
    }

    // Build and persist item
    const now = Date.now();
    const itemId = generateItemId(data.ticketPriceId, data.facilityId);

    const newItem: CartItem = {
      id: itemId,
      ticketId: data.ticketPriceId,
      quantity: data.quantity,
      title: data.title,
      price: data.price,
      currency: data.currency,
      facilityId: data.facilityId,
      facilityName: data.facilityName,
      category: data.category,
      validityType: data.validityType,
      requiresIdentity: data.requiresIdentity,
      requiresPhoto: data.requiresPhoto,
      imageUrl: data.imageUrl ?? null,
      minPeople: data.minPeople,
      maxPeople: data.maxPeople ?? null,
      updatedAt: now,
    };

    const cartSession = await getOrCreateCartSession(session.user.id);
    const currentItems = readCartItems(cartSession);

    const existingIdx = currentItems.findIndex((i) => i.id === itemId);
    let updatedItems: CartItem[];

    if (existingIdx > -1) {
      updatedItems = [...currentItems];
      updatedItems[existingIdx] = {
        ...updatedItems[existingIdx],
        quantity: Math.min(
          updatedItems[existingIdx].quantity + data.quantity,
          MAX_QUANTITY_PER_ITEM,
        ),
        updatedAt: now,
      };
    } else {
      updatedItems = [...currentItems, newItem];
    }

    await prisma.cartSession.update({
      where: { id: cartSession.id },
      data: { items: toJsonItems(updatedItems) },
    });

    revalidatePath("/cart");
    return { success: true, data: { item: newItem } };
  } catch (error) {
    return handleServerActionError(error, "addToCart");
  }
}

export async function removeFromCartAction(
  input: z.infer<typeof removeFromCartSchema>,
): Promise<ActionResult<{ removed: boolean }>> {
  try {
    const data = removeFromCartSchema.parse(input);

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    if (!checkRateLimit(session.user.id)) {
      return { success: false, error: "Previše zahteva. Sačekajte trenutak." };
    }

    const lockError = await assertCartNotLocked(session.user.id);
    if (lockError) return lockError;

    const cartSession = await getOrCreateCartSession(session.user.id);
    const currentItems = readCartItems(cartSession);

    const _removedItem = currentItems.find((i) => i.id === data.itemId);
    const updatedItems = currentItems.filter((i) => i.id !== data.itemId);

    await prisma.cartSession.update({
      where: { id: cartSession.id },
      data: { items: toJsonItems(updatedItems) },
    });

    revalidatePath("/cart");
    return { success: true, data: { removed: true } };
  } catch (error) {
    return handleServerActionError(error, "removeFromCart");
  }
}

export async function updateCartQuantityAction(
  input: z.infer<typeof updateCartQuantitySchema>,
): Promise<ActionResult<{ item?: CartItem; removed?: boolean }>> {
  try {
    const data = updateCartQuantitySchema.parse(input);

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    if (!checkRateLimit(session.user.id)) {
      return { success: false, error: "Previše zahteva. Sačekajte trenutak." };
    }

    const lockError = await assertCartNotLocked(session.user.id);
    if (lockError) return lockError;

    const cartSession = await getOrCreateCartSession(session.user.id);
    const currentItems = readCartItems(cartSession);
    const now = Date.now();

    if (data.quantity <= 0) {
      const updatedItems = currentItems.filter((i) => i.id !== data.itemId);
      await prisma.cartSession.update({
        where: { id: cartSession.id },
        data: { items: toJsonItems(updatedItems) },
      });
      revalidatePath("/cart");
      return { success: true, data: { removed: true } };
    }

    const existingIdx = currentItems.findIndex((i) => i.id === data.itemId);
    if (existingIdx === -1) {
      return { success: false, error: "Stavka nije pronađena u korpi." };
    }

    const cappedQuantity = Math.min(data.quantity, MAX_QUANTITY_PER_ITEM);
    const updatedItems = [...currentItems];
    updatedItems[existingIdx] = {
      ...updatedItems[existingIdx],
      quantity: cappedQuantity,
      updatedAt: now,
    };

    await prisma.cartSession.update({
      where: { id: cartSession.id },
      data: { items: toJsonItems(updatedItems) },
    });

    revalidatePath("/cart");
    return { success: true, data: { item: updatedItems[existingIdx] } };
  } catch (error) {
    return handleServerActionError(error, "updateCartQuantity");
  }
}

export async function getCartAction(): Promise<
  ActionResult<{ items: CartItem[]; facilityId?: string }>
> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    const cartSession = await prisma.cartSession.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    if (!cartSession) {
      return { success: true, data: { items: [] } };
    }

    // 🧹 Stale cart cleanup — delete if expired and not locked
    if (
      cartSession.expiresAt &&
      new Date() > new Date(cartSession.expiresAt) &&
      !cartSession.locked
    ) {
      await prisma.cartSession.delete({ where: { id: cartSession.id } });
      return { success: true, data: { items: [] } };
    }

    const currentItems = readCartItems(cartSession);
    const validatedItems: CartItem[] = [];
    let needsUpdate = false;

    for (const item of currentItems) {
      const ticketPrice = await prisma.ticketPrice.findUnique({
        where: { id: item.ticketId },
        include: {
          ticketType: {
            include: {
              category: { include: { facility: true } },
            },
          },
        },
      });

      if (
        !ticketPrice ||
        !ticketPrice.isActive ||
        ticketPrice.ticketType.category.facility.status !== "ACTIVE"
      ) {
        needsUpdate = true;
        continue;
      }

      const currentPrice = Number(ticketPrice.price);
      if (currentPrice !== item.price) {
        needsUpdate = true;
        validatedItems.push({ ...item, price: currentPrice, updatedAt: Date.now() });
      } else {
        validatedItems.push(item);
      }
    }

    if (needsUpdate) {
      await prisma.cartSession.update({
        where: { id: cartSession.id },
        data: { items: toJsonItems(validatedItems) },
      });
    }

    const facilityId = validatedItems.length > 0 ? validatedItems[0].facilityId : undefined;

    revalidatePath("/cart");
    return { success: true, data: { items: validatedItems, facilityId } };
  } catch (error) {
    return handleServerActionError(error, "getCart");
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
      await prisma.cartSession.update({
        where: { id: cartSession.id },
        data: { items: [], locked: false },
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
 */
export async function setCartLockAction(
  locked: boolean,
): Promise<ActionResult<{ locked: boolean }>> {
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
      await prisma.cartSession.update({
        where: { id: cartSession.id },
        data: { locked },
      });
    }

    return { success: true, data: { locked } };
  } catch (error) {
    return handleServerActionError(error, "setCartLock");
  }
}
