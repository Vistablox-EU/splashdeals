import "server-only";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/app/(server)/lib/prisma";
import { generateIdempotencyKey, withStripeRetry } from "@/app/(server)/lib/stripe-utils";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/types/cart";

const CHECKOUT_TRANSACTION_ATTEMPTS = 3;
const CHECKOUT_SESSION_TTL_SECONDS = 31 * 60;

const checkoutSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  holderName: z.string().trim().min(1).optional().nullable(),
  holderPhotoUrl: z.string().url().optional().nullable(),
  promoCode: z.string().trim().max(64).optional().nullable(),
});

export interface TicketDetail {
  ticketPriceId: string;
  quantity: number;
  facilityId: string;
  ticketTypeTitle: string;
  priceLabel: string | null;
  unitPrice: number;
  dayType: string | null;
  timeSlot: string | null;
  validityType: string;
}

export interface CreateCheckoutSessionResult {
  url: string;
}

type CheckoutReservation = {
  transactionId: string;
  cartId: string;
  cartVersion: number;
  subtotalAmount: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  discountPercent: number;
  promoCode: string | null;
  campaignId: string | null;
  ticketDetails: TicketDetail[];
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
};

function createOrderRef() {
  return `SD-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function isRetryableTransactionError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2034" || error.code === "P2002")
  );
}

async function withSerializableRetry<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= CHECKOUT_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (!isRetryableTransactionError(error) || attempt === CHECKOUT_TRANSACTION_ATTEMPTS) {
        throw error;
      }
    }
  }

  throw new Error("Pokretanje plaćanja nije uspelo.");
}

function isAvailableTicketPrice(
  ticketPrice: Awaited<ReturnType<typeof loadCanonicalPrices>>[number],
  now: Date,
) {
  return (
    ticketPrice.isActive &&
    ticketPrice.ticketType.isActive &&
    ticketPrice.ticketType.category.isActive &&
    ticketPrice.ticketType.category.facility.status === "ACTIVE" &&
    (!ticketPrice.validFrom || ticketPrice.validFrom <= now) &&
    (!ticketPrice.validTo || ticketPrice.validTo >= now) &&
    (!ticketPrice.saleStart || ticketPrice.saleStart <= now) &&
    (!ticketPrice.saleEnd || ticketPrice.saleEnd >= now)
  );
}

function loadCanonicalPrices(tx: Prisma.TransactionClient, ticketPriceIds: string[]) {
  return tx.ticketPrice.findMany({
    where: { id: { in: ticketPriceIds } },
    include: {
      ticketType: {
        include: {
          category: { include: { facility: true } },
        },
      },
    },
  });
}

async function reserveCheckout(
  params: z.infer<typeof checkoutSchema>,
): Promise<CheckoutReservation> {
  return withSerializableRetry(async (tx) => {
    const cart = await tx.cartSession.findUnique({
      where: { userId: params.userId },
      include: { cartItems: true },
    });

    if (!cart || cart.cartItems.length === 0) {
      throw new Error("Vaša korpa je prazna.");
    }
    if (cart.locked) {
      throw new Error("Plaćanje za ovu korpu je već u toku.");
    }

    const ticketPriceIds = cart.cartItems.map((item) => item.ticketPriceId);
    const canonicalPrices = await loadCanonicalPrices(tx, ticketPriceIds);
    const canonicalById = new Map(
      canonicalPrices.map((ticketPrice) => [ticketPrice.id, ticketPrice]),
    );
    const now = new Date();
    const ticketDetails: TicketDetail[] = [];
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let facilityId: string | null = null;
    let subtotalAmount = new Prisma.Decimal(0);

    for (const cartItem of cart.cartItems) {
      const ticketPrice = canonicalById.get(cartItem.ticketPriceId);
      if (!ticketPrice || !isAvailableTicketPrice(ticketPrice, now)) {
        throw new Error("Jedna od izabranih karata više nije dostupna.");
      }

      const ticketType = ticketPrice.ticketType;
      const facility = ticketType.category.facility;
      if (facilityId && facilityId !== facility.id) {
        throw new Error("U jednoj korpi možete imati karte samo za jedan objekat.");
      }
      facilityId = facility.id;

      const minimumQuantity = Math.max(1, ticketType.minPeople);
      const maximumQuantity = Math.min(
        ticketType.maxPeople ?? MAX_QUANTITY_PER_ITEM,
        MAX_QUANTITY_PER_ITEM,
      );
      if (cartItem.quantity < minimumQuantity || cartItem.quantity > maximumQuantity) {
        throw new Error(
          `Dozvoljena količina za kartu „${ticketType.title}“ je od ${minimumQuantity} do ${maximumQuantity}.`,
        );
      }

      if (
        (ticketType.requiresIdentity && !params.holderName) ||
        (ticketType.requiresPhoto && !params.holderPhotoUrl)
      ) {
        throw new Error("Podaci o vlasniku karte su obavezni.");
      }

      const unitPrice = new Prisma.Decimal(ticketPrice.price);
      subtotalAmount = subtotalAmount.plus(unitPrice.mul(cartItem.quantity));
      const detail: TicketDetail = {
        ticketPriceId: ticketPrice.id,
        quantity: cartItem.quantity,
        facilityId: facility.id,
        ticketTypeTitle: ticketType.title,
        priceLabel: ticketPrice.label,
        unitPrice: unitPrice.toNumber(),
        dayType: ticketPrice.dayType,
        timeSlot: ticketPrice.timeSlot,
        validityType: ticketType.validityType,
      };
      ticketDetails.push(detail);
      lineItems.push({
        price_data: {
          currency: "rsd",
          product_data: {
            name: `${facility.name} - ${ticketType.title}`,
            description: `${ticketType.title}${ticketPrice.label ? ` (${ticketPrice.label})` : ""}`,
          },
          unit_amount: unitPrice.mul(100).toDecimalPlaces(0).toNumber(),
        },
        quantity: cartItem.quantity,
      });
    }

    if (!facilityId) {
      throw new Error("Vaša korpa je prazna.");
    }

    let campaignId: string | null = null;
    let normalizedPromoCode: string | null = null;
    let discountPercent = 0;

    if (params.promoCode) {
      normalizedPromoCode = params.promoCode.trim().toUpperCase();
      const campaign = await tx.campaign.findUnique({
        where: { code: normalizedPromoCode },
        include: { facilityRestrictions: true },
      });

      if (!campaign || !campaign.isActive || campaign.validFrom > now || campaign.validTo < now) {
        throw new Error("Promo kod nije važeći ili je istekao.");
      }
      if (
        campaign.minPurchaseAmount !== null &&
        subtotalAmount.lessThan(campaign.minPurchaseAmount)
      ) {
        throw new Error(
          `Minimalni iznos za ovaj promo kod je ${Number(campaign.minPurchaseAmount)} RSD.`,
        );
      }
      if (
        campaign.facilityRestrictions.length > 0 &&
        !campaign.facilityRestrictions.some((restriction) => restriction.facilityId === facilityId)
      ) {
        throw new Error("Promo kod ne važi za izabrani objekat.");
      }
      if (campaign.usageLimit !== null) {
        const pendingReservations = await tx.transaction.count({
          where: {
            campaignId: campaign.id,
            status: "PENDING",
          },
        });
        if (campaign.usedCount + pendingReservations >= campaign.usageLimit) {
          throw new Error("Promo kod je dostigao maksimalan broj korišćenja.");
        }
      }

      campaignId = campaign.id;
      discountPercent = Number(campaign.discountPercent);
    }

    const discountAmount = subtotalAmount
      .mul(discountPercent)
      .div(100)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const totalAmount = subtotalAmount.minus(discountAmount);

    const transaction = await tx.transaction.create({
      data: {
        orderRef: createOrderRef(),
        userId: params.userId,
        facilityId,
        cartId: cart.id,
        cartVersion: cart.version + 1,
        campaignId,
        stripeSession: null,
        subtotalAmount,
        discountAmount,
        totalAmount,
        currency: "RSD",
        status: "PENDING",
        promoCode: normalizedPromoCode,
        holderName: params.holderName ?? null,
        holderPhotoUrl: params.holderPhotoUrl ?? null,
        ticketDetails: ticketDetails as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    const lockAcquired = await tx.cartSession.updateMany({
      where: { id: cart.id, version: cart.version, locked: false },
      data: {
        locked: true,
        lockedAt: now,
        lockExpiresAt: new Date(now.getTime() + CHECKOUT_SESSION_TTL_SECONDS * 1000),
        activeCheckoutTransactionId: transaction.id,
        version: { increment: 1 },
      },
    });
    if (lockAcquired.count !== 1) {
      throw new Error("Korpa je izmenjena tokom pokretanja plaćanja. Pokušajte ponovo.");
    }

    return {
      transactionId: transaction.id,
      cartId: cart.id,
      cartVersion: cart.version + 1,
      subtotalAmount,
      discountAmount,
      totalAmount,
      discountPercent,
      promoCode: normalizedPromoCode,
      campaignId,
      ticketDetails,
      lineItems,
    };
  });
}

async function releaseFailedReservation(reservation: CheckoutReservation) {
  await prisma.$transaction(async (tx) => {
    await tx.transaction.updateMany({
      where: { id: reservation.transactionId, status: "PENDING" },
      data: { status: "FAILED" },
    });
    await tx.cartSession.updateMany({
      where: {
        id: reservation.cartId,
        version: reservation.cartVersion,
        activeCheckoutTransactionId: reservation.transactionId,
        locked: true,
      },
      data: {
        locked: false,
        lockedAt: null,
        lockExpiresAt: null,
        activeCheckoutTransactionId: null,
      },
    });
  });
}

/**
 * Creates a Stripe Checkout Session from the authenticated server cart.
 * Client-provided item, price, facility, campaign identity, and totals are never accepted.
 */
export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  holderName?: string | null;
  holderPhotoUrl?: string | null;
  promoCode?: string | null;
}): Promise<CreateCheckoutSessionResult> {
  const data = checkoutSchema.parse(params);
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!stripeSecret) throw new Error("Platform configuration error");
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL is not configured");

  const stripe = new Stripe(stripeSecret, { apiVersion: "2026-05-27.dahlia" });
  const reservation = await reserveCheckout(data);
  let stripeSessionId: string | null = null;

  try {
    let couponId: string | null = null;
    if (reservation.discountPercent > 0) {
      const coupon = await withStripeRetry(() =>
        stripe.coupons.create(
          {
            duration: "once",
            amount_off: reservation.discountAmount
              .mul(100)
              .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
              .toNumber(),
            currency: "rsd",
            name: reservation.promoCode ?? undefined,
            metadata: {
              campaignId: reservation.campaignId ?? "",
              transactionId: reservation.transactionId,
            },
          },
          {
            idempotencyKey: generateIdempotencyKey(
              { transactionId: reservation.transactionId, operation: "coupon" },
              reservation.transactionId,
            ),
          },
        ),
      );
      couponId = coupon.id;
    }

    const expiresAt = Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_TTL_SECONDS;
    const session = await withStripeRetry(() =>
      stripe.checkout.sessions.create(
        {
          payment_method_types: ["card"],
          line_items: reservation.lineItems,
          mode: "payment",
          customer_email: data.email,
          success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${siteUrl}/cart?checkout=cancelled`,
          expires_at: expiresAt,
          ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
          metadata: {
            cartId: reservation.cartId,
            transactionId: reservation.transactionId,
            userId: data.userId,
          },
        },
        {
          idempotencyKey: generateIdempotencyKey(
            { transactionId: reservation.transactionId, operation: "session" },
            reservation.transactionId,
          ),
        },
      ),
    );
    stripeSessionId = session.id;

    const expectedAmountMinor = reservation.totalAmount
      .mul(100)
      .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
      .toNumber();
    if (session.currency?.toLowerCase() !== "rsd") {
      throw new Error("Valuta plaćanja se ne poklapa sa sadržajem korpe.");
    }
    if (session.amount_total !== expectedAmountMinor) {
      throw new Error("Iznos za plaćanje se ne poklapa sa sadržajem korpe.");
    }
    if (!session.url) {
      throw new Error("Stripe nije vratio adresu za plaćanje.");
    }

    await prisma.transaction.update({
      where: { id: reservation.transactionId },
      data: {
        stripeSession: session.id,
        checkoutExpiresAt: new Date((session.expires_at ?? expiresAt) * 1000),
        totalAmount: new Prisma.Decimal(session.amount_total).div(100),
      },
    });

    return { url: session.url };
  } catch (error) {
    if (stripeSessionId) {
      await stripe.checkout.sessions.expire(stripeSessionId).catch(() => undefined);
    }
    await releaseFailedReservation(reservation);
    throw error;
  }
}
