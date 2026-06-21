import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { prisma } from "@/server/lib/prisma";
import { generateIdempotencyKey, withStripeRetry } from "@/server/lib/stripe-utils";

const checkoutSchema = z.object({
  items: z.array(z.object({
    ticketPriceId: z.string().uuid(),
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
    const ticketDetails: { 
      ticketPriceId: string; 
      quantity: number; 
      facilityId: string;
      ticketTypeTitle: string;
      priceLabel: string | null;
      unitPrice: number;
      dayType: string | null;
      timeSlot: string | null;
    }[] = [];

    // 1. Verify and Process Each Item — supports both new (ticketPriceId) and legacy (ticketTierId)
    for (const item of items) {
      const tp = await prisma.ticketPrice.findUnique({
        where: { id: item.ticketPriceId },
        include: {
          ticketType: {
            include: {
              category: {
                include: { facility: true }
              }
            }
          }
        }
      });

      if (!tp || !tp.isActive) {
        return NextResponse.json(
          { error: `Karta nije dostupna.` },
          { status: 404, headers: { 'Cache-Control': 'no-store, must-revalidate' } }
        );
      }

      const ticketPrice = tp;
      const ticketType = tp.ticketType;
      const facility = ticketType.category.facility;

      // Validate Identity for Personalized Passes
      if ((ticketType.requiresIdentity && !holderName) || (ticketType.requiresPhoto && !holderPhotoUrl)) {
        return NextResponse.json(
          { error: "Personalizovane karte zahtevaju identifikaciju nosioca." },
          { 
            status: 400,
            headers: { 'Cache-Control': 'no-store, must-revalidate' }
          }
        );
      }

      const facilityName = facility.name;
      const productName = `${facilityName} - ${ticketType.title}`;
      const labelSuffix = ticketPrice.label ? ` (${ticketPrice.label})` : "";
      const productDescription = `${ticketType.title}${labelSuffix}`;

      lineItems.push({
        price_data: {
          currency: "rsd",
          product_data: {
            name: productName,
            description: productDescription,
          },
          unit_amount: Math.round(Number(ticketPrice.price) * 100),
        },
        quantity: item.quantity,
      });

      ticketDetails.push({
        ticketPriceId: item.ticketPriceId,
        quantity: item.quantity,
        facilityId: facility.id,
        ticketTypeTitle: ticketType.title,
        priceLabel: ticketPrice.label,
        unitPrice: Number(ticketPrice.price),
        dayType: ticketPrice.dayType,
        timeSlot: ticketPrice.timeSlot,
      });
    }

    const idempotencyKey = generateIdempotencyKey({ body, userId: null });

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
          orderDetails: JSON.stringify(ticketDetails),
          holderName: holderName || "",
          holderPhotoUrl: holderPhotoUrl || "",
          fulfillmentEmail: email || "",
        },
      }, { idempotencyKey });
    });

    // 4. Create PENDING Transaction with ticketDetails snapshot
    let checkoutUserId: string | null = null;
    if (email) {
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name: email.split("@")[0] || "Customer" },
      });
      checkoutUserId = user.id;
    }

    await prisma.transaction.create({
      data: {
        facilityId: ticketDetails[0].facilityId,
        stripeSession: session.id,
        totalAmount: (session.amount_total || 0) / 100,
        currency: "RSD",
        status: "PENDING",
        userId: checkoutUserId || "",
        ticketDetails: JSON.stringify(ticketDetails.map((td) => ({
          type: td.ticketTypeTitle,
          price: td.unitPrice,
          label: td.priceLabel,
          dayType: td.dayType,
          timeSlot: td.timeSlot,
          quantity: td.quantity,
        }))),
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
