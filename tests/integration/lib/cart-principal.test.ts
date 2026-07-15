import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  cookiesGet: vi.fn(),
  cookiesSet: vi.fn(),
  cookiesDelete: vi.fn(),
  cartFindUnique: vi.fn(),
  cartCreate: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/app/(server)/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: mocks.cookiesGet,
    set: mocks.cookiesSet,
    delete: mocks.cookiesDelete,
  })),
}));
vi.mock("@/app/(server)/lib/prisma", () => ({
  prisma: {
    cartSession: {
      findUnique: mocks.cartFindUnique,
      create: mocks.cartCreate,
    },
  },
}));

import {
  GUEST_CART_COOKIE_NAME,
  createGuestCartToken,
  hashGuestCartToken,
} from "@/app/(server)/lib/guest-cart-token";
import { resolveCartPrincipal } from "@/app/(server)/lib/cart-principal";

describe("cart principal resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(null);
    mocks.cookiesGet.mockReturnValue(undefined);
  });

  it("prefers the authenticated user principal over a guest cookie", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.cookiesGet.mockReturnValue({ value: "guest-raw-token" });

    const principal = await resolveCartPrincipal({ createGuestIfMissing: false });

    expect(principal).toEqual({
      type: "user",
      userId: "user-1",
      rateLimitKey: "user:user-1",
    });
    expect(mocks.cartFindUnique).not.toHaveBeenCalled();
  });

  it("returns a guest principal from a valid cookie without creating carts on read", async () => {
    const { rawToken, tokenHash } = createGuestCartToken();
    mocks.cookiesGet.mockReturnValue({ value: rawToken });
    mocks.cartFindUnique.mockResolvedValue({
      id: "guest-cart-1",
      guestTokenHash: tokenHash,
      userId: null,
    });

    const principal = await resolveCartPrincipal({ createGuestIfMissing: false });

    expect(principal).toEqual({
      type: "guest",
      guestTokenHash: tokenHash,
      rateLimitKey: `guest:${tokenHash}`,
      cartId: "guest-cart-1",
      shouldSetCookie: false,
      rawToken: null,
    });
    expect(mocks.cartCreate).not.toHaveBeenCalled();
    expect(mocks.cookiesGet).toHaveBeenCalledWith(GUEST_CART_COOKIE_NAME);
  });

  it("creates a guest cart and cookie only on the first mutation", async () => {
    mocks.cookiesGet.mockReturnValue(undefined);
    mocks.cartCreate.mockImplementation(async ({ data }: { data: { guestTokenHash: string } }) => ({
      id: "new-guest-cart",
      guestTokenHash: data.guestTokenHash,
      userId: null,
    }));

    const principal = await resolveCartPrincipal({ createGuestIfMissing: true });

    expect(principal.type).toBe("guest");
    if (principal.type !== "guest") throw new Error("expected guest principal");
    expect(principal.cartId).toBe("new-guest-cart");
    expect(principal.shouldSetCookie).toBe(true);
    expect(principal.rawToken).toBeTruthy();
    expect(hashGuestCartToken(principal.rawToken!)).toBe(principal.guestTokenHash);
    expect(mocks.cartCreate).toHaveBeenCalledTimes(1);
  });

  it("returns an anonymous empty principal on read when no cookie exists", async () => {
    const principal = await resolveCartPrincipal({ createGuestIfMissing: false });
    expect(principal).toEqual({
      type: "anonymous",
      rateLimitKey: null,
    });
    expect(mocks.cartCreate).not.toHaveBeenCalled();
  });
});
