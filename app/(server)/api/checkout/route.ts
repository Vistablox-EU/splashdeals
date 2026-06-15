import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { generateIdempotencyKey, withStripeRetry } from "@/lib/stripe-utils";

const checkoutSchema = z.object({
  items: z.array(z.object({
    ticketTierId: z.string().uuid(),
    quantity: z.number().int().positive().max(50),
  })).min(1),
  email: z.string().email().optional().nullable(),
  holderName: z.string().optional().nullable(),
  holderPhotoUrl: z.string().url().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      console.error("Missing STRIPE_SECRET_KEY");
      return NextResponse.json(
        { error: "Platform configuration error" },
        { 
          status: 500,
          headers: { 'Cache-Control': 'no-store, must-revalidate' }
        }
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2026-05-27.dahlia",
    });

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error },
        { 
          status: 400,
          headers: { 'Cache-Control': 'no-store, must-revalidate' }
        }
      );
    }

    const { items, email, holderName, holderPhotoUrl } = parsed.data;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const orderDetails: { ticketTierId: string; quantity: number; facilityId: string }[] = [];

    // 1. Verify and Process Each Item
    for (const item of items) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: item.ticketTierId },
        include: { 
          group: {
            include: { facility: true }
          },
          facility: true,
        },
      });

      if (!ticket || !ticket.isActive) {
        return NextResponse.json(
          { error: `Karta ${item.ticketTierId} nije dostupna.` },
          { 
            status: 404,
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
          }
        );
      }

      // 2. Validate Identity for Personalized Passes
      if ((ticket.requiresIdentity && !holderName) || (ticket.requiresPhoto && !holderPhotoUrl)) {
        return NextResponse.json(
          { error: "Personalizovane karte zahtevaju identifikaciju nosioca." },
          { 
            status: 400,
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
          }
        );
      }

      const facilityName = ticket.group?.facility.name || ticket.facility.name;
      const productName = ticket.group
        ? `${facilityName} - ${ticket.group.title}`
        : `${facilityName} - ${ticket.title}`;
      const productDescription = ticket.group ? `Tip: ${ticket.title}` : `Karta: ${ticket.title}`;

      lineItems.push({
        price_data: {
          currency: "rsd",
          product_data: {
            name: productName,
            description: productDescription,
          },
          unit_amount: Math.round(Number(ticket.price) * 100),
        },
        quantity: item.quantity,
      });

      orderDetails.push({
        ticketTierId: item.ticketTierId,
        quantity: item.quantity,
        facilityId: ticket.group?.facilityId || ticket.facilityId,
      });
    }

    const idempotencyKey = generateIdempotencyKey({ body, userId: null }); // No auth context yet

    // 3. Create Checkout Session with Retry and Idempotency
    const session = await withStripeRetry(async () => {
      return await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        customer_email: email || undefined, 
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/facilities`, 
        metadata: {
          orderDetails: JSON.stringify(orderDetails),
          holderName: holderName || "",
          holderPhotoUrl: holderPhotoUrl || "",
          fulfillmentEmail: email || "",
        },
      }, { idempotencyKey });
    });

    // 4. Create PENDING Transaction in our DB
    // We assume the first facility in the list is the primary facility for the transaction record
    await prisma.transaction.create({
      data: {
        facilityId: orderDetails[0].facilityId,
        stripeSession: session.id,
        totalAmount: (session.amount_total || 0) / 100,
        currency: "RSD",
        status: "PENDING",
        // If the user email is provided, we can attempt to link the user here once we have established user context logic
      },
    });

    return NextResponse.json(
      { url: session.url },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Stripe Checkout Error:", message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store, must-revalidate' }
      }
    );
  }
}
