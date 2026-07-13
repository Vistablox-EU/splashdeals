"use server";

import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { handleServerActionError, type ActionResult } from "@/server/lib/server-action-error";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/types/cart";
import type { CartItem } from "@/lib/types/cart";

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

/**
 * Generates the same composite ID the client uses so server and client
 * cart items stay in sync.
 */
const generateItemId = (ticketId: string, facilityId?: string) => {
  return `${ticketId}-${facilityId || "unknown"}`;
};

/**
 * Reads the cart items array from a CartSession's JSON field,
 * casting through unknown for Prisma Json type compatibility.
 */
function readCartItems(session: { items: unknown }): CartItem[] {
  return (session.items as CartItem[]) ?? [];
}

/**
 * Casts a CartItem[] to a type compatible with Prisma's Json field.
 */
function toJsonItems(items: CartItem[]): Prisma.InputJsonValue {
  return items as unknown as Prisma.InputJsonValue;
}

/**
 * Reads (or creates) the CartSession for the authenticated user.
 */
async function getOrCreateCartSession(userId: string) {
  let session = await prisma.cartSession.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!session) {
    session = await prisma.cartSession.create({
      data: {
        userId,
        items: [],
      },
    });
  }

  return session;
}

// ─── Server Actions ─────────────────────────────────────────────────────────

/**
 * 🛒 Add an item to the server-side cart session.
 *
 * Validates that the ticket price exists and is active, that the facility
 * is active, and that the user is authenticated. Merges quantities for
 * duplicate items (same ticketId + facilityId).
 */
export async function addToCartAction(
  input: z.infer<typeof addToCartSchema>,
): Promise<ActionResult<{ item: CartItem }>> {
  try {
    const data = addToCartSchema.parse(input);

    // ── Auth check ────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni da biste dodali stavku u korpu." };
    }

    // ── Validate ticket price exists & is active ──────────────────
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

    // ── Validate facility is active ───────────────────────────────
    const facility = ticketPrice.ticketType.category.facility;
    if (facility.status !== "ACTIVE") {
      return { success: false, error: "Objekat trenutno nije aktivan." };
    }

    // ── Validate facilityId matches ───────────────────────────────
    if (facility.id !== data.facilityId) {
      return { success: false, error: "Ulaznica ne pripada izabranom objektu." };
    }

    // ── Build cart item ───────────────────────────────────────────
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

    // ── Upsert into CartSession ───────────────────────────────────
    const cartSession = await getOrCreateCartSession(session.user.id);
    const currentItems = readCartItems(cartSession);

    // Merge: if item with same ID exists, add quantities (capped)
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

/**
 * 🗑️ Remove an item from the server-side cart session.
 */
export async function removeFromCartAction(
  input: z.infer<typeof removeFromCartSchema>,
): Promise<ActionResult<{ removed: boolean }>> {
  try {
    const data = removeFromCartSchema.parse(input);

    // ── Auth check ────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    const cartSession = await getOrCreateCartSession(session.user.id);
    const currentItems = readCartItems(cartSession);

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

/**
 * 🔢 Update the quantity of an item in the server-side cart session.
 * Setting quantity to 0 removes the item.
 */
export async function updateCartQuantityAction(
  input: z.infer<typeof updateCartQuantitySchema>,
): Promise<ActionResult<{ item?: CartItem; removed?: boolean }>> {
  try {
    const data = updateCartQuantitySchema.parse(input);

    // ── Auth check ────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    const cartSession = await getOrCreateCartSession(session.user.id);
    const currentItems = readCartItems(cartSession);

    const now = Date.now();

    if (data.quantity <= 0) {
      // Remove item
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

/**
 * 📖 Get the server-side cart for the authenticated user.
 *
 * Re-validates prices against current TicketPrice records and removes
 * items whose tickets are no longer active or whose facility is inactive.
 */
export async function getCartAction(): Promise<ActionResult<{ items: CartItem[] }>> {
  try {
    // ── Auth check ────────────────────────────────────────────────
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

    const currentItems = readCartItems(cartSession);

    // ── Re-validate prices & remove stale items ────────────────────
    const validatedItems: CartItem[] = [];
    let needsUpdate = false;

    for (const item of currentItems) {
      const ticketPrice = await prisma.ticketPrice.findUnique({
        where: { id: item.ticketId },
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

      // Remove if ticket is missing, inactive, or facility is not active
      if (
        !ticketPrice ||
        !ticketPrice.isActive ||
        ticketPrice.ticketType.category.facility.status !== "ACTIVE"
      ) {
        needsUpdate = true;
        continue;
      }

      // Update price if it's changed
      const currentPrice = Number(ticketPrice.price);
      if (currentPrice !== item.price) {
        needsUpdate = true;
        validatedItems.push({
          ...item,
          price: currentPrice,
          updatedAt: Date.now(),
        });
      } else {
        validatedItems.push(item);
      }
    }

    // Persist any validated changes back to the session
    if (needsUpdate) {
      await prisma.cartSession.update({
        where: { id: cartSession.id },
        data: { items: toJsonItems(validatedItems) },
      });
    }

    revalidatePath("/cart");

    return { success: true, data: { items: validatedItems } };
  } catch (error) {
    return handleServerActionError(error, "getCart");
  }
}

/**
 * 🧹 Clear all items from the server-side cart session.
 */
export async function clearCartAction(): Promise<ActionResult<{ cleared: boolean }>> {
  try {
    // ── Auth check ────────────────────────────────────────────────
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
        data: { items: [] },
      });
    }

    revalidatePath("/cart");

    return { success: true, data: { cleared: true } };
  } catch (error) {
    return handleServerActionError(error, "clearCart");
  }
}
