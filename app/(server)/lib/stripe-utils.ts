import "server-only";
import crypto from "node:crypto";

/**
 * 🌊 Generate a stable idempotency key for Stripe operations.
 * Pass a unique discriminator (e.g. transaction ID) to prevent
 * collisions between distinct operations with the same payload.
 * The 1-hour time window allows safe retries without double-charging.
 */
/**
 * Generates a deterministic idempotency key for Stripe operations.
 * Same payload + discriminator within the same 1-hour window produces the same key.
 */
export function generateIdempotencyKey(payload: unknown, discriminator?: string): string {
  const timeWindow = Math.floor(Date.now() / (60 * 60 * 1000));
  const data = JSON.stringify({ payload, window: timeWindow, discriminator });
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Retry wrapper for Stripe API calls with exponential backoff.
 * Skips retry on StripeInvalidRequestError (validation failures).
 */
export async function withStripeRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500,
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on Stripe validation errors
      if (
        error &&
        typeof error === "object" &&
        error !== null &&
        "type" in error &&
        (error as Record<string, unknown>).type === "StripeInvalidRequestError"
      ) {
        throw error;
      }

      console.warn(`[STRIPE RETRY] Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError;
}
