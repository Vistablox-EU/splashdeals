import { headers } from "next/headers";
import { after, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  fulfillPaidCheckout,
  releaseCheckoutSession,
} from "@/app/(server)/lib/checkout-fulfillment";
import { sendOrderConfirmation } from "@/app/(server)/lib/email";

const noStoreHeaders = { "Cache-Control": "no-store, must-revalidate" };

/**
 * Stripe webhook boundary. Signature verification happens before any processing.
 * Durable fulfillment is awaited so Stripe receives a retryable 500 on DB failure;
 * only non-critical confirmation email delivery is deferred with `after`.
 */
export async function POST(req: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret || !endpointSecret) {
    console.error("Missing Stripe configuration.");
    return NextResponse.json(
      { error: "Configuration Error" },
      { status: 500, headers: noStoreHeaders },
    );
  }

  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2026-05-27.dahlia" });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[STRIPE WEBHOOK] Signature verification failed: ${message}`);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const result = await fulfillPaidCheckout(session);

      if (result.newlyFulfilled && result.transaction.status === "SUCCESS") {
        after(() =>
          sendOrderConfirmation(result.transaction.id).catch((error) => {
            console.error("[STRIPE WEBHOOK] Confirmation email failed:", error);
          }),
        );
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await releaseCheckoutSession(session.id, "EXPIRED");
    } else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await releaseCheckoutSession(session.id, "FAILED");
    }

    return NextResponse.json({ received: true }, { headers: noStoreHeaders });
  } catch (error) {
    console.error(`[STRIPE WEBHOOK] Processing failed for event ${event.id}:`, error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
