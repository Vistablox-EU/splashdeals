import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  fulfillPaidCheckout,
  releaseCheckoutSession,
  releaseCheckoutTransaction,
} from "@/app/(server)/lib/checkout-fulfillment";
import { prisma } from "@/app/(server)/lib/prisma";

/**
 * Expires abandoned PENDING checkout attempts without deleting their audit trail.
 * The exact bound cart is unlocked after Stripe can no longer accept payment.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2026-05-27.dahlia" });
  const now = new Date();
  const preStripeCutoff = new Date(now.getTime() - 15 * 60 * 1000);

  try {
    const abandonedTransactions = await prisma.transaction.findMany({
      where: {
        status: "PENDING",
        OR: [
          { checkoutExpiresAt: { lte: now } },
          {
            checkoutExpiresAt: null,
            createdAt: { lt: preStripeCutoff },
          },
        ],
      },
      select: {
        id: true,
        stripeSession: true,
        cartId: true,
        userId: true,
      },
      take: 100,
    });

    let expired = 0;
    for (const transaction of abandonedTransactions) {
      try {
        if (transaction.stripeSession) {
          const stripeSession = await stripe.checkout.sessions.retrieve(transaction.stripeSession);
          if (stripeSession.payment_status === "paid") {
            await fulfillPaidCheckout(stripeSession);
            continue;
          }
          if (stripeSession.status === "open") {
            await stripe.checkout.sessions.expire(transaction.stripeSession);
          }
          const result = await releaseCheckoutSession(transaction.stripeSession, "EXPIRED");
          if (result.released) expired += 1;
          continue;
        }

        const result = await releaseCheckoutTransaction(transaction.id, "EXPIRED");
        if (result.released) expired += 1;
      } catch (error) {
        console.warn(`[CRON] Failed to expire transaction ${transaction.id}:`, error);
      }
    }

    return NextResponse.json({
      processed: abandonedTransactions.length,
      expired,
    });
  } catch (error) {
    console.error("[CRON ERROR] Cleanup failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
