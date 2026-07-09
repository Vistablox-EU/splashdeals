import { NextResponse } from "next/server";
import { prisma } from "@/server/lib/prisma";
import Stripe from "stripe";

/**
 * 🌊 Cron Job: Abandoned Session Cleanup
 * Deletes PENDING transactions older than 24h and expires Stripe sessions.
 */
export async function GET(request: Request) {
  // Simple auth check for Cron jobs (CRON_SECRET)
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2026-05-27.dahlia",
  });

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    // 1. Find PENDING transactions older than 24h
    const abandonedTransactions = await prisma.transaction.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: twentyFourHoursAgo },
      },
      select: { id: true, stripeSession: true },
      take: 100, // Process in batches
    });

    console.info(`[CRON] Found ${abandonedTransactions.length} abandoned sessions.`);

    let successCount = 0;
    for (const tx of abandonedTransactions) {
      try {
        // Optional: Expire the session in Stripe to prevent late payments
        // We catch errors here because the session might already be expired or completed.
        await stripe.checkout.sessions.expire(tx.stripeSession).catch(() => {});

        // Delete the transaction record
        await prisma.transaction.delete({
          where: { id: tx.id },
        });

        successCount++;
      } catch (e) {
        console.warn(`[CRON] Failed to cleanup session ${tx.stripeSession}:`, e);
      }
    }

    return NextResponse.json({
      processed: abandonedTransactions.length,
      deleted: successCount,
    });
  } catch (error) {
    console.error("[CRON ERROR] Cleanup failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
