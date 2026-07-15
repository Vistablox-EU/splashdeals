import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  cookiesGet: vi.fn(),
  cookiesDelete: vi.fn(),
  transaction: vi.fn(),
  cartFindUnique: vi.fn(),
  cartUpdate: vi.fn(),
  cartDelete: vi.fn(),
  itemFindMany: vi.fn(),
  itemFindFirst: vi.fn(),
  itemCreate: vi.fn(),
  itemUpdate: vi.fn(),
  itemDeleteMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/app/(server)/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: mocks.cookiesGet,
    set: vi.fn(),
    delete: mocks.cookiesDelete,
  })),
}));
vi.mock("@/app/(server)/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    cartSession: {
      findUnique: mocks.cartFindUnique,
      update: mocks.cartUpdate,
      delete: mocks.cartDelete,
    },
    cartSessionItem: {
      findMany: mocks.itemFindMany,
      findFirst: mocks.itemFindFirst,
      create: mocks.itemCreate,
      update: mocks.itemUpdate,
      deleteMany: mocks.itemDeleteMany,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { claimGuestCartAction } from "@/app/(server)/actions/guest-cart-claim";
import { createGuestCartToken, GUEST_CART_COOKIE_NAME } from "@/app/(server)/lib/guest-cart-token";

const USER_ID = "user-1";
const GUEST_CART_ID = "guest-cart";
const USER_CART_ID = "user-cart";

describe("claimGuestCartAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: USER_ID } });
    mocks.transaction.mockImplementation(async (operation: (tx: unknown) => unknown) =>
      operation({
        cartSession: {
          findUnique: mocks.cartFindUnique,
          update: mocks.cartUpdate,
          delete: mocks.cartDelete,
        },
        cartSessionItem: {
          findMany: mocks.itemFindMany,
          findFirst: mocks.itemFindFirst,
          create: mocks.itemCreate,
          update: mocks.itemUpdate,
          deleteMany: mocks.itemDeleteMany,
        },
      }),
    );
  });

  it("claims a guest cart when the authenticated user has no cart", async () => {
    const { rawToken, tokenHash } = createGuestCartToken();
    mocks.cookiesGet.mockReturnValue({ value: rawToken });
    mocks.cartFindUnique.mockImplementation(
      async ({ where }: { where: Record<string, string> }) => {
        if (where.guestTokenHash === tokenHash) {
          return {
            id: GUEST_CART_ID,
            guestTokenHash: tokenHash,
            userId: null,
            locked: false,
            version: 1,
            cartItems: [{ facilityId: "facility-a", quantity: 1 }],
          };
        }
        if (where.userId === USER_ID) return null;
        return null;
      },
    );
    mocks.cartUpdate.mockResolvedValue({ id: GUEST_CART_ID, userId: USER_ID });

    const result = await claimGuestCartAction();

    expect(result).toEqual({
      success: true,
      data: { action: "claim", cartId: GUEST_CART_ID },
    });
    expect(mocks.cartUpdate).toHaveBeenCalledWith({
      where: { id: GUEST_CART_ID },
      data: {
        userId: USER_ID,
        guestTokenHash: null,
        expiresAt: null,
      },
    });
    expect(mocks.cookiesDelete).toHaveBeenCalledWith(GUEST_CART_COOKIE_NAME);
  });

  it("returns a conflict payload when guest and user carts have different facilities", async () => {
    const { rawToken, tokenHash } = createGuestCartToken();
    mocks.cookiesGet.mockReturnValue({ value: rawToken });
    mocks.cartFindUnique.mockImplementation(
      async ({ where }: { where: Record<string, string> }) => {
        if (where.guestTokenHash === tokenHash) {
          return {
            id: GUEST_CART_ID,
            guestTokenHash: tokenHash,
            userId: null,
            locked: false,
            version: 1,
            cartItems: [{ facilityId: "facility-a", facilityName: "Aqua Park A", quantity: 2 }],
          };
        }
        if (where.userId === USER_ID) {
          return {
            id: USER_CART_ID,
            userId: USER_ID,
            guestTokenHash: null,
            locked: false,
            version: 2,
            cartItems: [{ facilityId: "facility-b", facilityName: "Aqua Park B", quantity: 1 }],
          };
        }
        return null;
      },
    );

    const result = await claimGuestCartAction();

    expect(result).toEqual({
      success: true,
      data: {
        action: "conflict",
        guestCartId: GUEST_CART_ID,
        userCartId: USER_CART_ID,
        guestFacilityId: "facility-a",
        userFacilityId: "facility-b",
        guestFacilityName: "Aqua Park A",
        userFacilityName: "Aqua Park B",
      },
    });
    expect(mocks.cookiesDelete).not.toHaveBeenCalled();
  });
});
