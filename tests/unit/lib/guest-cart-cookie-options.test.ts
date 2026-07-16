import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/app/(server)/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("@/app/(server)/lib/prisma", () => ({
  prisma: { cartSession: { findUnique: vi.fn(), create: vi.fn() } },
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })),
}));

import { getGuestCartCookieBaseOptions } from "@/app/(server)/lib/cart-principal";

describe("getGuestCartCookieBaseOptions", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("omits Domain in development (host-only cookie)", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("COOKIE_DOMAIN", "");

    const opts = getGuestCartCookieBaseOptions();
    expect(opts.domain).toBeUndefined();
    expect(opts.path).toBe("/");
    expect(opts.sameSite).toBe("lax");
    expect(opts.httpOnly).toBe(true);
    expect(opts.secure).toBe(false);
  });

  it("sets Domain=.splashdeals.rs in production by default", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("COOKIE_DOMAIN", "");

    const opts = getGuestCartCookieBaseOptions();
    // empty COOKIE_DOMAIN should fall back to default
    expect(opts.domain === ".splashdeals.rs" || opts.domain === "").toBe(true);
    // when COOKIE_DOMAIN is "" the code uses || so domain is .splashdeals.rs
    expect(opts.domain).toBe(".splashdeals.rs");
    expect(opts.secure).toBe(true);
    expect(opts.path).toBe("/");
  });

  it("honors COOKIE_DOMAIN override in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("COOKIE_DOMAIN", ".example.test");

    expect(getGuestCartCookieBaseOptions().domain).toBe(".example.test");
  });
});
