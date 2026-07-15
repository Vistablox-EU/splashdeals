import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getSession: vi.fn(),
  revalidatePath: vi.fn(),
  cookiesGet: vi.fn(),
  cookiesSet: vi.fn(),
  cookiesDelete: vi.fn(),
  cartRateLimit: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  cartSession: {
    findUnique: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  cartSessionItem: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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
    get: mocks.cookiesGet,
    set: mocks.cookiesSet,
    delete: mocks.cookiesDelete,
  })),
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { addToCartAction, getCartAction } from "@/app/(server)/actions/cart";
import { GUEST_CART_COOKIE_NAME } from "@/app/(server)/lib/guest-cart-token";

const TICKET_PRICE_ID = "11111111-1111-4111-8111-111111111111";
const FACILITY_ID = "22222222-2222-4222-8222-222222222222";
const CART_ID = "77777777-7777-4777-8777-777777777777";
const now = new Date("2026-07-15T12:00:00.000Z");

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
    validityType: "FLEXIBLE_30_DAY",
    requiresIdentity: false,
    requiresPhoto: false,
    imageUrl: null,
    minPeople: 1,
    maxPeople: 5,
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

describe("guest cart actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(null);
    mocks.cookiesGet.mockReturnValue(undefined);
    mocks.transaction.mockImplementation(async (operation: (tx: unknown) => unknown) =>
      operation({
        cartRateLimit: mocks.cartRateLimit,
        cartSession: mocks.cartSession,
        cartSessionItem: mocks.cartSessionItem,
        ticketPrice: mocks.ticketPrice,
      }),
    );
    mocks.cartRateLimit.findUnique.mockResolvedValue(null);
    mocks.cartRateLimit.upsert.mockResolvedValue({});
    mocks.ticketPrice.findUnique.mockResolvedValue(canonicalTicketPrice);
    mocks.cartSession.create.mockImplementation(
      async ({ data }: { data: { guestTokenHash: string } }) => ({
        id: CART_ID,
        userId: null,
        guestTokenHash: data.guestTokenHash,
        locked: false,
        version: 0,
        expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      }),
    );
    mocks.cartSession.findUnique.mockImplementation(
      async ({ where }: { where: { id?: string } }) => {
        if (where.id === CART_ID) {
          return {
            id: CART_ID,
            userId: null,
            guestTokenHash: "hash",
            locked: false,
            version: 0,
            expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          };
        }
        return null;
      },
    );
    mocks.cartSession.update.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: CART_ID,
        userId: null,
        guestTokenHash: "hash",
        locked: false,
        version: 0,
        expiresAt: data.expiresAt ?? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      }),
    );
    mocks.cartSessionItem.findFirst.mockResolvedValue(null);
    mocks.cartSessionItem.findUnique.mockResolvedValue(null);
    mocks.cartSessionItem.create.mockResolvedValue({
      id: "item-1",
      ticketPriceId: TICKET_PRICE_ID,
      quantity: 1,
      title: "Gradski bazen - Odrasli (Radni dan)",
      price: 1250,
      currency: "RSD",
      facilityId: FACILITY_ID,
      facilityName: "Gradski bazen",
      category: "Bazen",
      validityType: "FLEXIBLE_30_DAY",
      requiresIdentity: false,
      requiresPhoto: false,
      imageUrl: null,
      minPeople: 1,
      maxPeople: 5,
      updatedAt: now,
    });
    mocks.cartSession.updateMany.mockResolvedValue({ count: 1 });
  });

  it("allows unauthenticated guests to add items via a hashed guest cookie", async () => {
    const result = await addToCartAction({ ticketPriceId: TICKET_PRICE_ID, quantity: 1 });

    expect(result.success).toBe(true);
    expect(mocks.cartSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          guestTokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      }),
    );
    expect(mocks.cookiesSet).toHaveBeenCalledWith(
      GUEST_CART_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );
    expect(mocks.cartRateLimit.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { principalKey: expect.stringMatching(/^guest:/) },
      }),
    );
  });

  it("returns an empty cart for anonymous reads without creating a guest cart", async () => {
    const result = await getCartAction();

    expect(result).toEqual({ success: true, data: { items: [] } });
    expect(mocks.cartSession.create).not.toHaveBeenCalled();
    expect(mocks.cookiesSet).not.toHaveBeenCalled();
  });
});
