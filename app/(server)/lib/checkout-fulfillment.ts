import "server-only";
import crypto from "node:crypto";
import { Prisma, TicketStatus } from "@prisma/client";
import type Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/app/(server)/lib/prisma";
import { getNextSubscriptionExpiry } from "@/app/(server)/lib/utils/seasonal";

const ticketDetailSchema = z.object({
  ticketPriceId: z.string().uuid(),
  quantity: z.number().int().positive().max(50),
  facilityId: z.string().min(1),
  ticketTypeTitle: z.string().min(1),
  priceLabel: z.string().nullable(),
  unitPrice: z.number().nonnegative(),
  dayType: z.string().nullable(),
  timeSlot: z.string().nullable(),
  validityType: z.string().min(1),
});

const ticketDetailsSchema = z.array(ticketDetailSchema).min(1);
const FULFILLMENT_TRANSACTION_ATTEMPTS = 3;

function isRetryableTransactionError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

async function withSerializableRetry<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= FULFILLMENT_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (!isRetryableTransactionError(error) || attempt === FULFILLMENT_TRANSACTION_ATTEMPTS) {
        throw error;
      }
    }
  }
  throw new Error("Izdavanje karata nije uspelo.");
}

function expectedStripeAmount(totalAmount: Prisma.Decimal) {
  return totalAmount.mul(100).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toNumber();
}

function ticketExpiry(validityType: string, now: Date) {
  if (validityType === "SUMMER_SEASON") {
    return getNextSubscriptionExpiry(now.getFullYear(), now);
  }
  const expiryDate = new Date(now);
  expiryDate.setDate(expiryDate.getDate() + 30);
  return expiryDate;
}

/**
 * Atomically fulfills a paid Stripe Checkout Session from the immutable
 * Transaction snapshot and clears only the CartSession bound at checkout.
 */
export async function fulfillPaidCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") {
    throw new Error(`Stripe session ${session.id} is not paid.`);
  }

  return withSerializableRetry(async (tx) => {
    const transaction = await tx.transaction.findUnique({
      where: { stripeSession: session.id },
    });
    if (!transaction) {
      throw new Error(`No transaction is bound to Stripe session ${session.id}.`);
    }

    if (transaction.status === "SUCCESS") {
      return { transaction, newlyFulfilled: false };
    }

    const expectedMetadata = {
      transactionId: transaction.id,
      cartId: transaction.cartId,
      userId: transaction.userId,
    };
    const receivedMetadata = {
      transactionId: session.metadata?.transactionId ?? null,
      cartId: session.metadata?.cartId ?? null,
      userId: session.metadata?.userId ?? null,
    };
    if (
      receivedMetadata.transactionId !== expectedMetadata.transactionId ||
      receivedMetadata.cartId !== expectedMetadata.cartId ||
      receivedMetadata.userId !== expectedMetadata.userId
    ) {
      const reviewTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "PAID_REVIEW",
          fulfillmentError: {
            code: "STRIPE_METADATA_MISMATCH",
            expected: expectedMetadata,
            received: receivedMetadata,
          },
        },
      });
      return { transaction: reviewTransaction, newlyFulfilled: false };
    }

    if (transaction.status === "PAID_REVIEW") {
      return { transaction, newlyFulfilled: false };
    }
    if (transaction.status !== "PENDING") {
      const reviewTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "PAID_REVIEW",
          fulfillmentError: {
            code: "LATE_PAID_SESSION",
            previousStatus: transaction.status,
          },
        },
      });
      return { transaction: reviewTransaction, newlyFulfilled: false };
    }

    const expectedCurrency = transaction.currency.toLowerCase();
    if (session.currency?.toLowerCase() !== expectedCurrency) {
      const reviewTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "PAID_REVIEW",
          fulfillmentError: {
            code: "STRIPE_CURRENCY_MISMATCH",
            expected: expectedCurrency,
            received: session.currency ?? null,
          },
        },
      });
      return { transaction: reviewTransaction, newlyFulfilled: false };
    }

    if (session.amount_total !== expectedStripeAmount(transaction.totalAmount)) {
      const reviewTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "PAID_REVIEW",
          fulfillmentError: {
            code: "STRIPE_AMOUNT_MISMATCH",
            expected: expectedStripeAmount(transaction.totalAmount),
            received: session.amount_total,
          },
        },
      });
      return { transaction: reviewTransaction, newlyFulfilled: false };
    }

    if (!transaction.cartId || transaction.cartVersion === null) {
      const reviewTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "PAID_REVIEW",
          fulfillmentError: { code: "CART_BINDING_MISSING" },
        },
      });
      return { transaction: reviewTransaction, newlyFulfilled: false };
    }

    const boundCart = await tx.cartSession.findUnique({
      where: { id: transaction.cartId },
      select: {
        id: true,
        userId: true,
        locked: true,
        version: true,
        activeCheckoutTransactionId: true,
      },
    });
    if (
      !boundCart ||
      boundCart.userId !== transaction.userId ||
      !boundCart.locked ||
      boundCart.version !== transaction.cartVersion ||
      boundCart.activeCheckoutTransactionId !== transaction.id
    ) {
      const reviewTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "PAID_REVIEW",
          fulfillmentError: { code: "CART_LOCK_MISMATCH" },
        },
      });
      return { transaction: reviewTransaction, newlyFulfilled: false };
    }

    const ticketDetails = ticketDetailsSchema.parse(transaction.ticketDetails);
    const ticketPriceIds = [...new Set(ticketDetails.map((item) => item.ticketPriceId))];
    const ticketPrices = await tx.ticketPrice.findMany({
      where: { id: { in: ticketPriceIds } },
      select: { id: true },
    });
    if (ticketPrices.length !== ticketPriceIds.length) {
      const reviewTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "PAID_REVIEW",
          fulfillmentError: { code: "TICKET_PRICE_MISSING" },
        },
      });
      return { transaction: reviewTransaction, newlyFulfilled: false };
    }

    const existingTickets = await tx.issuedTicket.count({
      where: { transactionId: transaction.id },
    });
    if (existingTickets > 0) {
      throw new Error(`Transaction ${transaction.id} has inconsistent fulfillment state.`);
    }

    const now = new Date();
    const issuedTickets = ticketDetails.flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({
        qrHash: crypto.randomUUID().replace(/-/g, ""),
        ticketPriceId: item.ticketPriceId,
        transactionId: transaction.id,
        userId: transaction.userId,
        expiryDate: ticketExpiry(item.validityType, now),
        usageLimit: item.validityType === "SUMMER_SEASON" ? 999 : 1,
        status: TicketStatus.ACTIVE,
        holderName: transaction.holderName,
        holderPhotoUrl: transaction.holderPhotoUrl,
      })),
    );
    await tx.issuedTicket.createMany({ data: issuedTickets });

    let promoUsageCounted = transaction.promoUsageCounted;
    if (transaction.campaignId && !promoUsageCounted) {
      await tx.campaign.update({
        where: { id: transaction.campaignId },
        data: { usedCount: { increment: 1 } },
      });
      promoUsageCounted = true;
    }

    const fulfilled = await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "SUCCESS",
        promoUsageCounted,
        fulfillmentError: Prisma.JsonNull,
      },
    });

    await tx.cartSessionItem.deleteMany({
      where: { cartId: transaction.cartId },
    });
    await tx.cartSession.updateMany({
      where: {
        id: transaction.cartId,
        userId: transaction.userId,
        locked: true,
        version: transaction.cartVersion,
        activeCheckoutTransactionId: transaction.id,
      },
      data: {
        locked: false,
        lockedAt: null,
        lockExpiresAt: null,
        activeCheckoutTransactionId: null,
        notified: true,
      },
    });

    return { transaction: fulfilled, newlyFulfilled: true };
  });
}

async function releaseCheckout(
  where: Prisma.TransactionWhereUniqueInput,
  status: "CANCELLED" | "EXPIRED" | "FAILED",
): Promise<{ released: boolean; cartId: string | null }> {
  return withSerializableRetry(async (tx) => {
    const transaction = await tx.transaction.findUnique({ where });
    if (!transaction || transaction.status !== "PENDING") {
      return { released: false, cartId: transaction?.cartId ?? null };
    }

    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status },
    });
    if (transaction.cartId && transaction.cartVersion !== null) {
      await tx.cartSession.updateMany({
        where: {
          id: transaction.cartId,
          userId: transaction.userId,
          locked: true,
          version: transaction.cartVersion,
          activeCheckoutTransactionId: transaction.id,
        },
        data: {
          locked: false,
          lockedAt: null,
          lockExpiresAt: null,
          activeCheckoutTransactionId: null,
        },
      });
    }

    return { released: true, cartId: transaction.cartId };
  });
}

export function releaseCheckoutSession(
  stripeSessionId: string,
  status: "CANCELLED" | "EXPIRED" | "FAILED",
) {
  return releaseCheckout({ stripeSession: stripeSessionId }, status);
}

export function releaseCheckoutTransaction(
  transactionId: string,
  status: "CANCELLED" | "EXPIRED" | "FAILED",
) {
  return releaseCheckout({ id: transactionId }, status);
}

/**
 * Unlock carts whose checkout lock window has expired, and expire orphan PENDING txs.
 * Abandoned Stripe checkouts previously left carts permanently locked (remove/qty dead).
 */
export async function releaseExpiredCartLocksForUser(
  userId: string,
): Promise<{ unlocked: boolean }> {
  const now = new Date();
  const staleLockedAtCutoff = new Date(now.getTime() - 35 * 60 * 1000);

  const unlocked = await prisma.cartSession.updateMany({
    where: {
      userId,
      locked: true,
      OR: [
        { lockExpiresAt: { lt: now } },
        { lockExpiresAt: null, lockedAt: { lt: staleLockedAtCutoff } },
        { lockExpiresAt: null, lockedAt: null },
      ],
    },
    data: {
      locked: false,
      lockedAt: null,
      lockExpiresAt: null,
      activeCheckoutTransactionId: null,
    },
  });

  // Expire PENDING transactions bound to this user that are older than the lock window
  // when cart is no longer locked (or was just unlocked).
  await prisma.transaction.updateMany({
    where: {
      userId,
      status: "PENDING",
      createdAt: { lt: staleLockedAtCutoff },
    },
    data: { status: "EXPIRED" },
  });

  return { unlocked: unlocked.count > 0 };
}

/**
 * Force-unlock the user's cart (after cancelling/expiring any open checkout).
 * Used when lock is stuck even if Stripe session retrieval fails.
 */
export async function forceUnlockUserCart(userId: string): Promise<void> {
  await prisma.cartSession.updateMany({
    where: { userId, locked: true },
    data: {
      locked: false,
      lockedAt: null,
      lockExpiresAt: null,
      activeCheckoutTransactionId: null,
    },
  });
}
