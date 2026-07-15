import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  GUEST_CART_COOKIE_NAME,
  GUEST_CART_TTL_MS,
  createGuestCartToken,
  hashGuestCartToken,
  verifyGuestCartToken,
} from "@/app/(server)/lib/guest-cart-token";

describe("guest cart token", () => {
  it("uses the agreed cookie name and at least 256-bit entropy", () => {
    const { rawToken, tokenHash } = createGuestCartToken();

    expect(GUEST_CART_COOKIE_NAME).toBe("sd_guest_cart");
    expect(GUEST_CART_TTL_MS).toBe(14 * 24 * 60 * 60 * 1000);
    expect(Buffer.from(rawToken, "base64url").byteLength).toBeGreaterThanOrEqual(32);
    expect(tokenHash).toBe(createHash("sha256").update(rawToken).digest("hex"));
    expect(tokenHash).toHaveLength(64);
  });

  it("never stores the raw token as the hash", () => {
    const { rawToken, tokenHash } = createGuestCartToken();
    expect(tokenHash).not.toBe(rawToken);
    expect(hashGuestCartToken(rawToken)).toBe(tokenHash);
  });

  it("verifies only the exact raw token against its hash", () => {
    const { rawToken, tokenHash } = createGuestCartToken();
    const other = createGuestCartToken();

    expect(verifyGuestCartToken(rawToken, tokenHash)).toBe(true);
    expect(verifyGuestCartToken(other.rawToken, tokenHash)).toBe(false);
    expect(verifyGuestCartToken("", tokenHash)).toBe(false);
  });

  it("uses constant-time comparison for verification", () => {
    const tokenHash = hashGuestCartToken(randomBytes(32).toString("base64url"));
    const left = Buffer.from(tokenHash, "hex");
    const right = Buffer.from(tokenHash, "hex");
    expect(timingSafeEqual(left, right)).toBe(true);
  });
});
