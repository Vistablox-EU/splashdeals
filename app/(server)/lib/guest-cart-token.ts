import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const GUEST_CART_COOKIE_NAME = "sd_guest_cart";
export const GUEST_CART_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const GUEST_TOKEN_BYTES = 32;

export function createGuestCartToken() {
  const rawToken = randomBytes(GUEST_TOKEN_BYTES).toString("base64url");
  return {
    rawToken,
    tokenHash: hashGuestCartToken(rawToken),
  };
}

export function hashGuestCartToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function verifyGuestCartToken(rawToken: string, tokenHash: string) {
  if (!rawToken || !tokenHash) return false;
  const expected = Buffer.from(hashGuestCartToken(rawToken), "hex");
  const actual = Buffer.from(tokenHash, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
