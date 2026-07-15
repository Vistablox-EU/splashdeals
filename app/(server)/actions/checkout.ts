"use server";

import Stripe from "stripe";
import { createCheckoutSession } from "@/app/(server)/lib/stripe-checkout";
import {
  fulfillPaidCheckout,
  releaseCheckoutSession,
} from "@/app/(server)/lib/checkout-fulfillment";
import { handleServerActionError, type ActionResult } from "@/app/(server)/lib/server-action-error";
import { sendOrderConfirmation } from "@/app/(server)/lib/email";
import { auth } from "@/app/(server)/lib/auth";
import { prisma } from "@/app/(server)/lib/prisma";
import { headers } from "next/headers";

/**
 * 🌊 Initialise a Stripe Checkout session from the cart.
 *
 * Validates items, builds Stripe line items, creates a PENDING transaction,
 * and returns the Stripe Checkout redirect URL.
 *
 * Requires the user to be authenticated via social auth.
 * Called from CartClient.tsx — the client redirects the browser to the returned URL.
 * Cart is cleared in fulfillOrder (webhook) after payment confirmation.
 */
export async function createCheckoutSessionAction(params: {
  holderName?: string | null;
  holderPhotoUrl?: string | null;
  promoCode?: string | null;
}): Promise<ActionResult<{ url: string }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni da biste nastavili kupovinu." };
    }

    const result = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email,
      holderName: params.holderName,
      holderPhotoUrl: params.holderPhotoUrl,
      promoCode: params.promoCode,
    });

    return { success: true, data: { url: result.url } };
  } catch (error) {
    return handleServerActionError(error, "checkout");
  }
}

/**
 * Cancels the authenticated user's current unpaid Checkout Session and releases
 * only the cart bound to that pending transaction.
 */
export async function cancelCheckoutSessionAction(): Promise<ActionResult<{ cancelled: boolean }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        userId: session.user.id,
        status: "PENDING",
        stripeSession: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!transaction?.stripeSession) {
      return { success: true, data: { cancelled: false } };
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) throw new Error("Platform configuration error");
    const stripe = new Stripe(stripeSecret, { apiVersion: "2026-05-27.dahlia" });
    const stripeSession = await stripe.checkout.sessions.retrieve(transaction.stripeSession);

    if (stripeSession.payment_status === "paid") {
      await fulfillPaidCheckout(stripeSession);
      return { success: true, data: { cancelled: false } };
    }
    if (stripeSession.status === "open") {
      await stripe.checkout.sessions.expire(transaction.stripeSession);
    }

    await releaseCheckoutSession(transaction.stripeSession, "CANCELLED");
    return { success: true, data: { cancelled: true } };
  } catch (error) {
    return handleServerActionError(error, "cancelCheckout");
  }
}

/**
 * 📧 Resends the order confirmation email for a given transaction.
 * Called from the success page when the user clicks "Pošalji ponovo na email".
 */
export async function resendConfirmationAction(
  transactionId: string,
): Promise<ActionResult<{ sent: boolean }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    const ownedTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: session.user.id,
        status: "SUCCESS",
      },
      select: { id: true },
    });
    if (!ownedTransaction) {
      return { success: false, error: "Narudžbina nije pronađena." };
    }

    await sendOrderConfirmation(ownedTransaction.id);
    return { success: true, data: { sent: true } };
  } catch (error) {
    return handleServerActionError(error, "resendConfirmation");
  }
}
