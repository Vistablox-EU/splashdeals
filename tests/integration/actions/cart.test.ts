import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getSession: vi.fn(),
  revalidatePath: vi.fn(),
  cartRateLimit: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  cartSession: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  cartSessionItem: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  ticketPrice: {
    findUnique: vi.fn(),
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/app/(server)/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/app/(server)/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    cartRateLimit: mocks.cartRateLimit,
    cartSession: mocks.cartSession,
    cartSessionItem: mocks.cartSessionItem,
    ticketPrice: mocks.ticketPrice,
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import {
  addToCartAction,
  clearCartAction,
  removeFromCartAction,
  updateCartQuantityAction,
} from "@/app/(server)/actions/cart";

const USER_ID = "user-1";
const CART_ID = "77777777-7777-4777-8777-777777777777";
const ITEM_ID = "88888888-8888-4888-8888-888888888888";
const TICKET_PRICE_ID = "11111111-1111-4111-8111-111111111111";
const FACILITY_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_FACILITY_ID = "33333333-3333-4333-8333-333333333333";

const now = new Date("2026-07-15T12:00:00.000Z");

const cartSession = {
  id: CART_ID,
  userId: USER_ID,
  guestTokenHash: null,
  items: null,
  locked: false,
  lockedAt: null,
  lockExpiresAt: null,
  activeCheckoutTransactionId: null,
  version: 3,
  notified: false,
  appliedPromo: null,
  expiresAt: null,
  createdAt: now,
  updatedAt: now,
};

const canonicalTicketPrice = {
  id: TICKET_PRICE_ID,
  isActive: true,
  price: { toString: () => "1250" },
  label: "Radni dan",
  validFrom: null,
  validTo: null,
  saleStart: null,
  saleEnd: null,
  ticketType: {
    title: "Odrasli",
    isActive: true,
    imageUrl: "https://example.com/adult.webp",
    requiresIdentity: true,
    requiresPhoto: false,
    minPeople: 1,
    maxPeople: 5,
    validityType: "FLEXIBLE_30_DAY",
    category: {
      isActive: true,
      facility: {
        id: FACILITY_ID,
        name: "Gradski bazen",
        category: "Bazen",
        status: "ACTIVE",
      },
    },
  },
};

const canonicalStoredItem = {
  id: ITEM_ID,
  cartId: CART_ID,
  ticketPriceId: TICKET_PRICE_ID,
  quantity: 2,
  title: "Gradski bazen - Odrasli (Radni dan)",
  price: 1250,
  currency: "RSD",
  facilityId: FACILITY_ID,
  facilityName: "Gradski bazen",
  category: "Bazen",
  validityType: "FLEXIBLE_30_DAY",
  requiresIdentity: true,
  requiresPhoto: false,
  imageUrl: "https://example.com/adult.webp",
  minPeople: 1,
  maxPeople: 5,
  createdAt: now,
  updatedAt: now,
};

describe("cart integrity actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (operation) =>
      operation({
        cartRateLimit: mocks.cartRateLimit,
        cartSession: mocks.cartSession,
        cartSessionItem: mocks.cartSessionItem,
        ticketPrice: mocks.ticketPrice,
      }),
    );
    mocks.getSession.mockResolvedValue({ user: { id: USER_ID } });
    mocks.cartRateLimit.findUnique.mockResolvedValue(null);
    mocks.cartRateLimit.upsert.mockResolvedValue(undefined);
    mocks.cartSession.findFirst.mockResolvedValue(cartSession);
    mocks.cartSession.findUnique.mockResolvedValue(cartSession);
    mocks.cartSession.upsert.mockResolvedValue(cartSession);
    mocks.cartSessionItem.findFirst.mockResolvedValue(null);
    mocks.cartSessionItem.findUnique.mockResolvedValue(null);
    mocks.cartSessionItem.findMany.mockResolvedValue([]);
    mocks.cartSessionItem.create.mockResolvedValue(canonicalStoredItem);
    mocks.cartSessionItem.update.mockResolvedValue(canonicalStoredItem);
    mocks.cartSessionItem.updateMany.mockResolvedValue({ count: 1 });
    mocks.cartSessionItem.deleteMany.mockResolvedValue({ count: 1 });
    mocks.cartSession.updateMany.mockResolvedValue({ count: 1 });
    mocks.ticketPrice.findUnique.mockResolvedValue(canonicalTicketPrice);
  });

  it("awaits the database rate limiter before mutating the cart", async () => {
    mocks.cartRateLimit.findUnique.mockResolvedValue({
      principalKey: `user:${USER_ID}`,
      callCount: 30,
      resetAt: new Date(Date.now() + 60_000),
    });

    const result = await addToCartAction({
      ticketPriceId: TICKET_PRICE_ID,
      quantity: 1,
    });

    expect(result).toEqual({
      success: false,
      error: "Previše zahteva. Pokušajte ponovo za minut.",
    });
    expect(mocks.ticketPrice.findUnique).not.toHaveBeenCalled();
  });

  it("fails closed when the database rate limiter cannot be enforced", async () => {
    mocks.cartRateLimit.findUnique.mockRejectedValue(new Error("rate limit storage unavailable"));

    const result = await addToCartAction({
      ticketPriceId: TICKET_PRICE_ID,
      quantity: 1,
    });

    expect(result.success).toBe(false);
    expect(mocks.ticketPrice.findUnique).not.toHaveBeenCalled();
    expect(mocks.cartSessionItem.create).not.toHaveBeenCalled();
  });

  it("retries a serialization conflict before mutating the cart", async () => {
    mocks.transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("serialization conflict", {
        code: "P2034",
        clientVersion: "7.8.0",
      }),
    );

    const result = await addToCartAction({
      ticketPriceId: TICKET_PRICE_ID,
      quantity: 1,
    });

    expect(result.success).toBe(true);
    expect(mocks.transaction).toHaveBeenCalledTimes(3);
  });

  it("runs cart validation and mutation in a serializable transaction", async () => {
    const result = await addToCartAction({
      ticketPriceId: TICKET_PRICE_ID,
      quantity: 1,
    });

    expect(result.success).toBe(true);
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.transaction.mock.calls[1]?.[1]).toEqual({ isolationLevel: "Serializable" });
  });

  it("increments the cart version in the same transaction after adding an item", async () => {
    const result = await addToCartAction({
      ticketPriceId: TICKET_PRICE_ID,
      quantity: 1,
    });

    expect(result.success).toBe(true);
    expect(mocks.cartSession.updateMany).toHaveBeenCalledWith({
      where: { id: CART_ID, version: 3, locked: false },
      data: { version: { increment: 1 } },
    });
  });

  it("hydrates canonical cart metadata from the database", async () => {
    const result = await addToCartAction({
      ticketPriceId: TICKET_PRICE_ID,
      quantity: 2,
    });

    expect(result.success).toBe(true);
    expect(mocks.ticketPrice.findUnique).toHaveBeenCalledWith({
      where: { id: TICKET_PRICE_ID },
      include: {
        ticketType: {
          include: {
            category: { include: { facility: true } },
          },
        },
      },
    });
    expect(mocks.cartSessionItem.create).toHaveBeenCalledWith({
      data: {
        cartId: CART_ID,
        ticketPriceId: TICKET_PRICE_ID,
        facilityId: FACILITY_ID,
        quantity: 2,
        title: "Gradski bazen - Odrasli (Radni dan)",
        price: 1250,
        currency: "RSD",
        facilityName: "Gradski bazen",
        category: "Bazen",
        validityType: "FLEXIBLE_30_DAY",
        requiresIdentity: true,
        requiresPhoto: false,
        imageUrl: "https://example.com/adult.webp",
        minPeople: 1,
        maxPeople: 5,
      },
    });
  });

  it("rejects tickets from a second facility", async () => {
    mocks.cartSessionItem.findFirst.mockResolvedValue({
      ...canonicalStoredItem,
      facilityId: OTHER_FACILITY_ID,
    });

    const result = await addToCartAction({
      ticketPriceId: TICKET_PRICE_ID,
      quantity: 1,
    });

    expect(result).toEqual({
      success: false,
      error: "U jednoj korpi možete imati karte samo za jedan objekat.",
    });
    expect(mocks.cartSessionItem.create).not.toHaveBeenCalled();
  });

  it("keeps additions blocked until checkout cancellation or expiry releases the lock", async () => {
    mocks.cartSession.upsert.mockResolvedValue({
      ...cartSession,
      locked: true,
      lockedAt: new Date(Date.now() - 10 * 60_000),
    });

    const result = await addToCartAction({
      ticketPriceId: TICKET_PRICE_ID,
      quantity: 1,
    });

    expect(result).toEqual({
      success: false,
      error: "Plaćanje je u toku. Otkažite ga pre izmene korpe.",
    });
    expect(mocks.cartSession.update).not.toHaveBeenCalled();
    expect(mocks.cartSessionItem.create).not.toHaveBeenCalled();
  });

  it("increments the cart version atomically when clearing it", async () => {
    const result = await clearCartAction();

    expect(result).toEqual({ success: true, data: { cleared: true } });
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.transaction.mock.calls[1]?.[1]).toEqual({ isolationLevel: "Serializable" });
    expect(mocks.cartSession.updateMany).toHaveBeenCalledWith({
      where: { id: CART_ID, version: 3, locked: false },
      data: { version: { increment: 1 } },
    });
  });

  it("blocks clearing the cart while payment is pending", async () => {
    mocks.cartSession.findUnique.mockResolvedValue({
      ...cartSession,
      locked: true,
      lockedAt: now,
    });

    const result = await clearCartAction();

    expect(result).toEqual({
      success: false,
      error: "Plaćanje je u toku. Otkažite ga pre izmene korpe.",
    });
    expect(mocks.cartSessionItem.deleteMany).not.toHaveBeenCalled();
  });

  it("increments the cart version atomically when removing an item", async () => {
    const result = await removeFromCartAction({ itemId: ITEM_ID });

    expect(result).toEqual({ success: true, data: { removed: true } });
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.transaction.mock.calls[1]?.[1]).toEqual({ isolationLevel: "Serializable" });
    expect(mocks.cartSession.updateMany).toHaveBeenCalledWith({
      where: { id: CART_ID, version: 3, locked: false },
      data: { version: { increment: 1 } },
    });
  });

  it("blocks item removal while payment is pending", async () => {
    mocks.cartSession.findUnique.mockResolvedValue({
      ...cartSession,
      locked: true,
      lockedAt: now,
    });

    const result = await removeFromCartAction({ itemId: ITEM_ID });

    expect(result).toEqual({
      success: false,
      error: "Plaćanje je u toku. Otkažite ga pre izmene korpe.",
    });
    expect(mocks.cartSessionItem.deleteMany).not.toHaveBeenCalled();
  });

  it("increments the cart version atomically when changing quantity", async () => {
    mocks.cartSessionItem.findFirst.mockResolvedValue(canonicalStoredItem);

    const result = await updateCartQuantityAction({ itemId: ITEM_ID, quantity: 3 });

    expect(result.success).toBe(true);
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    expect(mocks.cartSession.updateMany).toHaveBeenCalledWith({
      where: { id: CART_ID, version: 3, locked: false },
      data: { version: { increment: 1 } },
    });
  });

  it("blocks quantity changes while payment is pending", async () => {
    mocks.cartSession.findUnique.mockResolvedValue({
      ...cartSession,
      locked: true,
      lockedAt: now,
    });

    const result = await updateCartQuantityAction({
      itemId: ITEM_ID,
      quantity: 3,
    });

    expect(result).toEqual({
      success: false,
      error: "Plaćanje je u toku. Otkažite ga pre izmene korpe.",
    });
    expect(mocks.cartSessionItem.findFirst).not.toHaveBeenCalled();
    expect(mocks.cartSessionItem.update).not.toHaveBeenCalled();
  });

  it("does not update an item outside the authenticated user's cart", async () => {
    mocks.cartSessionItem.findFirst.mockResolvedValue(null);

    const result = await updateCartQuantityAction({
      itemId: ITEM_ID,
      quantity: 3,
    });

    expect(result).toEqual({
      success: false,
      error: "Stavka nije pronađena u vašoj korpi.",
    });
    expect(mocks.cartSessionItem.findFirst).toHaveBeenCalledWith({
      where: { id: ITEM_ID, cartId: CART_ID },
    });
    expect(mocks.cartSessionItem.updateMany).not.toHaveBeenCalled();
    expect(mocks.cartSessionItem.update).not.toHaveBeenCalled();
  });
});
