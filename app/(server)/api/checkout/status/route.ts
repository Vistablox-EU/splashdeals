import { NextResponse } from "next/server";
import { prisma } from "@/server/lib/prisma";
import Stripe from "stripe";
import { fulfillOrder } from "../../webhooks/stripe/route";

/**
 * 📡 Polling Endpoint for Transaction Status
 * Allows the success page to detect when the Stripe Webhook has finished fulfillment.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id" },
      { 
        status: 400,
        headers: { 'Cache-Control': 'no-store, must-revalidate' }
      }
    );
  }

  try {
    let transaction = await prisma.transaction.findFirst({
      where: {
        stripeSession: sessionId,
      },
      include: {
        issuedTickets: {
          include: {
            ticketPrice: {
              include: {
                ticketType: {
                  include: {
                    category: {
                      include: {
                        facility: true,
                      }
                    }
                  }
                }
              }
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { status: "PENDING" },
        { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
      );
    }

    // 🌊 Hybrid Polling Fallback: If status is PENDING, check Stripe directly to avoid webhook delay/failure bails
    if (transaction.status === "PENDING") {
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (stripeSecret) {
        const stripe = new Stripe(stripeSecret, {
          apiVersion: "2026-05-27.dahlia",
        });
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === "paid") {
          // Fulfill order immediately on the spot!
          await fulfillOrder(session);
          
          // Re-fetch transaction from DB to get the new successful state + issued tickets
          const updatedTransaction = await prisma.transaction.findFirst({
            where: {
              stripeSession: sessionId,
            },
            include: {
              issuedTickets: {
                include: {
                  ticketPrice: {
                    include: {
                      ticketType: {
                        include: {
                          category: {
                            include: {
                              facility: true,
                            }
                          }
                        }
                      }
                    }
                  },
                },
              },
            },
          });
          if (updatedTransaction) {
            transaction = updatedTransaction;
          }
        }
      }
    }

    // Success response should include basic transaction data for the UI
    return NextResponse.json(
      transaction,
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  } catch (error) {
    console.error("[TRANSACTION_STATUS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store, must-revalidate' }
      }
    );
  }
}
