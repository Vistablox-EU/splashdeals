import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/app/(server)/lib/auth";
import {
  fulfillPaidCheckout,
  releaseCheckoutSession,
} from "@/app/(server)/lib/checkout-fulfillment";
import { prisma } from "@/app/(server)/lib/prisma";
import { toCheckoutStatusDto } from "@/app/(server)/lib/checkout-status-dto";

const noStoreHeaders = { "Cache-Control": "no-store, must-revalidate" };
const transactionInclude = {
  issuedTickets: {
    include: {
      ticketPrice: {
        include: {
          ticketType: {
            include: {
              category: { include: { facility: true } },
            },
          },
        },
      },
    },
  },
} as const;

/**
 * Authenticated polling endpoint for the current user's Stripe transaction.
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders });
  }

  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id" },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    let transaction = await prisma.transaction.findFirst({
      where: {
        stripeSession: sessionId,
        userId: session.user.id,
      },
      include: transactionInclude,
    });
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404, headers: noStoreHeaders },
      );
    }

    if (transaction.status === "PENDING") {
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (stripeSecret) {
        const stripe = new Stripe(stripeSecret, { apiVersion: "2026-05-27.dahlia" });
        const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
        if (stripeSession.payment_status === "paid") {
          await fulfillPaidCheckout(stripeSession);
        } else if (stripeSession.status === "expired") {
          await releaseCheckoutSession(sessionId, "EXPIRED");
        }

        transaction = await prisma.transaction.findFirst({
          where: {
            stripeSession: sessionId,
            userId: session.user.id,
          },
          include: transactionInclude,
        });
        if (!transaction) {
          return NextResponse.json(
            { error: "Transaction not found" },
            { status: 404, headers: noStoreHeaders },
          );
        }
      }
    }

    return NextResponse.json(toCheckoutStatusDto(transaction), { headers: noStoreHeaders });
  } catch (error) {
    console.error("[TRANSACTION_STATUS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
