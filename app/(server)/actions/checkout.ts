"use server";

import Stripe from "stripe";
import { createCheckoutSession } from "@/app/(server)/lib/stripe-checkout";
import {
  fulfillPaidCheckout,
  forceUnlockUserCart,
  releaseCheckoutSession,
  releaseExpiredCartLocksForUser,
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
 * the cart lock. Always attempts unlock so abandoned checkouts cannot brick remove/qty.
 */
export async function cancelCheckoutSessionAction(): Promise<
  ActionResult<{ cancelled: boolean; unlocked: boolean }>
> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    // First: auto-unlock expired locks (lockExpiresAt in the past).
    const expired = await releaseExpiredCartLocksForUser(session.user.id);

    const transaction = await prisma.transaction.findFirst({
      where: {
        userId: session.user.id,
        status: "PENDING",
        stripeSession: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!transaction?.stripeSession) {
      // No open Stripe session — still force-unlock if cart is stuck locked.
      await forceUnlockUserCart(session.user.id);
      return { success: true, data: { cancelled: false, unlocked: true } };
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) throw new Error("Platform configuration error");
    const stripe = new Stripe(stripeSecret, { apiVersion: "2026-05-27.dahlia" });
    const stripeSession = await stripe.checkout.sessions.retrieve(transaction.stripeSession);

    if (stripeSession.payment_status === "paid") {
      await fulfillPaidCheckout(stripeSession);
      return { success: true, data: { cancelled: false, unlocked: false } };
    }
    if (stripeSession.status === "open") {
      await stripe.checkout.sessions.expire(transaction.stripeSession);
    }

    await releaseCheckoutSession(transaction.stripeSession, "CANCELLED");
    // Belt-and-suspenders: unlock even if version/binding mismatch blocked releaseCheckout.
    await forceUnlockUserCart(session.user.id);
    return { success: true, data: { cancelled: true, unlocked: true || expired.unlocked } };
  } catch (error) {
    // Last resort unlock so a Stripe API failure cannot leave the cart bricked.
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user?.id) await forceUnlockUserCart(session.user.id);
    } catch {
      // ignore
    }
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
