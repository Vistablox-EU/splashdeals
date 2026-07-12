import "server-only";
import { z } from "zod";
import Stripe from "stripe";
import { prisma } from "@/server/lib/prisma";
import { generateIdempotencyKey, withStripeRetry } from "@/server/lib/stripe-utils";
import { validatePromoCodeAction, incrementCampaignUsageAction } from "@/app/(server)/actions/campaigns";

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────

export const checkoutItemSchema = z.object({
  ticketPriceId: z.string().uuid(),
  quantity: z.number().int().positive().max(50),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1),
  email: z.string().email().optional().nullable(),
  holderName: z.string().optional().nullable(),
  holderPhotoUrl: z.string().url().optional().nullable(),
  promoCode: z.string().optional().nullable(),
  campaignId: z.string().optional().nullable(),
});

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface TicketDetail {
  ticketPriceId: string;
  quantity: number;
  facilityId: string;
  ticketTypeTitle: string;
  priceLabel: string | null;
  unitPrice: number;
  dayType: string | null;
  timeSlot: string | null;
}

export interface CreateCheckoutSessionResult {
  url: string;
}

// ──────────────────────────────────────────────
// Core function
// ──────────────────────────────────────────────

/**
 * 🌊 Creates a Stripe Checkout Session and a PENDING Transaction in the DB.
 *
 * Validates every TicketPrice against the DB, enforces identity requirements,
 * builds Stripe line items, and persists a pending transaction record.
 *
 * Throws on validation or processing errors — caller is responsible for
 * catching and returning a user-friendly response.
 */
export async function createCheckoutSession(params: {
  items: { ticketPriceId: string; quantity: number }[];
  email?: string | null;
  holderName?: string | null;
  holderPhotoUrl?: string | null;
  promoCode?: string | null;
  campaignId?: string | null;
}): Promise<CreateCheckoutSessionResult> {
  const { items, email, holderName, holderPhotoUrl, promoCode, campaignId } = params;

  // 1. Validate input at runtime (defence-in-depth beyond TypeScript)
  checkoutSchema.parse(params);

  // 2. Bootstrap Stripe
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    throw new Error("Platform configuration error");
  }
  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2026-05-27.dahlia",
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
  }

  // 3. Verify and process each item
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const ticketDetails: TicketDetail[] = [];

  for (const item of items) {
    const tp = await prisma.ticketPrice.findUnique({
      where: { id: item.ticketPriceId },
      include: {
        ticketType: {
          include: {
            category: {
              include: { facility: true },
            },
          },
        },
      },
    });

    if (!tp || !tp.isActive) {
      throw new Error(`Karta nije dostupna.`);
    }

    const ticketType = tp.ticketType;
    const facility = ticketType.category.facility;

    // Validate identity for personalised passes
    if (
      (ticketType.requiresIdentity && !holderName) ||
      (ticketType.requiresPhoto && !holderPhotoUrl)
    ) {
      throw new Error("Personalizovane karte zahtevaju identifikaciju nosioca.");
    }

    const facilityName = facility.name;
    const productName = `${facilityName} - ${ticketType.title}`;
    const labelSuffix = tp.label ? ` (${tp.label})` : "";
    const productDescription = `${ticketType.title}${labelSuffix}`;

    lineItems.push({
      price_data: {
        currency: "rsd",
        product_data: {
          name: productName,
          description: productDescription,
        },
        unit_amount: Math.round(Number(tp.price) * 100),
      },
      quantity: item.quantity,
    });

    ticketDetails.push({
      ticketPriceId: item.ticketPriceId,
      quantity: item.quantity,
      facilityId: facility.id,
      ticketTypeTitle: ticketType.title,
      priceLabel: tp.label,
      unitPrice: Number(tp.price),
      dayType: tp.dayType,
      timeSlot: tp.timeSlot,
    });
  }

  // ─── Validate promo code if provided ────────────────
  let discountPercent = 0;
  let validatedCampaignId: string | null = null;
  if (promoCode) {
    const facilityId = ticketDetails[0]?.facilityId;
    const validation = await validatePromoCodeAction(
      promoCode,
      facilityId,
      ticketDetails.reduce((sum, td) => sum + td.unitPrice * td.quantity, 0),
    );

    if (!validation.success || !validation.data || !validation.data.valid) {
      throw new Error(
        validation.data && "error" in validation.data
          ? validation.data.error
          : "Promo kod nije validan.",
      );
    }

    discountPercent = validation.data.discountPercent;
    validatedCampaignId = validation.data.campaignId;
  }

  const idempotencyKey = generateIdempotencyKey({ body: params, userId: null });

  // 4. Create Stripe Checkout Session with retry + idempotency
  const session = await withStripeRetry(async () => {
    return await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        customer_email: email || undefined,
        success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/facilities`,
        metadata: {
          orderDetails: JSON.stringify(ticketDetails),
          holderName: holderName || "",
          holderPhotoUrl: holderPhotoUrl || "",
          fulfillmentEmail: email || "",
          ...(validatedCampaignId && {
            campaignId: validatedCampaignId,
            discountPercent: String(discountPercent),
            promoCode: promoCode || "",
          }),
        },
      },
      { idempotencyKey },
    );
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  // 5. Upsert user if email provided, then create PENDING Transaction
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
      ticketDetails: JSON.stringify(
        ticketDetails.map((td) => ({
          type: td.ticketTypeTitle,
          price: td.unitPrice,
          label: td.priceLabel,
          dayType: td.dayType,
          timeSlot: td.timeSlot,
          quantity: td.quantity,
        })),
      ),
    },
  });

  return { url: session.url };
}
