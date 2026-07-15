import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  cartFindFirst: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => undefined) }));
vi.mock("@/app/(server)/lib/prisma", () => ({
  prisma: { cartSession: { findFirst: mocks.cartFindFirst } },
}));
vi.mock("@/app/(server)/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/dictionaries", () => ({ getDictionary: vi.fn() }));

import CheckoutPage from "@/app/(web)/checkout/page";

describe("legacy checkout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("uses the cart as the single server-authoritative checkout review surface", async () => {
    await expect(CheckoutPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledWith("/cart");
    expect(mocks.cartFindFirst).not.toHaveBeenCalled();
  });
});
