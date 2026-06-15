/**
 * 🌊 Stripe Test Helpers
 *
 * Provides utilities for interacting with Stripe test mode during E2E tests.
 */

import Stripe from "stripe";
import crypto from "crypto";

/**
 * Returns an authorized Stripe client.
 * Supports both live (sk_live_...) and test (sk_test_...) keys.
 * Requires STRIPE_SECRET_KEY env var to be set before running tests.
 */
export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is required. Set it in .env or pass as env var."
    );
  }
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

/**
 * Constructs a signed webhook payload for simulating
 * a checkout.session.completed event.
 */
export function buildSignedWebhookPayload(
  session: Stripe.Checkout.Session,
  secret: string
): { payload: string; signature: string } {
  const event = {
    id: `evt_test_${Date.now()}`,
    type: "checkout.session.completed",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: session,
    },
  };

  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signedContent = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedContent)
    .digest("hex");

  return {
    payload,
    signature: `t=${timestamp},v1=${signature}`,
  };
}

/**
 * Stripe test card numbers mapped to their behavior.
 */
export const TEST_CARDS = {
  SUCCESS: "4242424242424242",
  DECLINED: "4000000000000002",
  INSUFFICIENT_FUNDS: "4000000000009995",
  REQUIRES_AUTH: "4000002500003155",
  EXPIRED: "4000000000000069",
  INCORRECT_CVC: "4000000000000127",
  PROCESSING_ERROR: "4000000000000119",
} as const;

/**
 * Waits for the /api/checkout/status endpoint to return SUCCESS.
 */
export async function waitForFulfillment(
  sessionId: string,
  baseURL: string,
  timeout = 30_000
): Promise<boolean> {
  const url = `${baseURL}/api/checkout/status?session_id=${sessionId}`;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "SUCCESS") {
          return true;
        }
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }

  return false;
}
