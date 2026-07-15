import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transactionBoundary: vi.fn(),
  transaction: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  issuedTicket: {
    count: vi.fn(),
    createMany: vi.fn(),
  },
  ticketPrice: {
    findMany: vi.fn(),
  },
  campaign: {
    update: vi.fn(),
  },
  cartSessionItem: {
    deleteMany: vi.fn(),
  },
  cartSession: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/app/(server)/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transactionBoundary,
    transaction: mocks.transaction,
    issuedTicket: mocks.issuedTicket,
    ticketPrice: mocks.ticketPrice,
    campaign: mocks.campaign,
    cartSessionItem: mocks.cartSessionItem,
    cartSession: mocks.cartSession,
  },
}));

import {
  fulfillPaidCheckout,
  releaseCheckoutSession,
} from "@/app/(server)/lib/checkout-fulfillment";

const TRANSACTION_ID = "99999999-9999-4999-8999-999999999999";
const CART_ID = "77777777-7777-4777-8777-777777777777";
const USER_ID = "user-1";
const FACILITY_ID = "22222222-2222-4222-8222-222222222222";
const TICKET_PRICE_ID = "11111111-1111-4111-8111-111111111111";
const SESSION_ID = "cs_test_exact_cart";

const ticketDetails = [
  {
    ticketPriceId: TICKET_PRICE_ID,
    quantity: 2,
    facilityId: FACILITY_ID,
    ticketTypeTitle: "Odrasli",
    priceLabel: "Radni dan",
    unitPrice: 1250,
    dayType: "WEEKDAY",
    timeSlot: "FULL_DAY",
    validityType: "FLEXIBLE_30_DAY",
  },
];

const pendingTransaction = {
  id: TRANSACTION_ID,
  orderRef: "SD-260715-TEST01",
  userId: USER_ID,
  facilityId: FACILITY_ID,
  cartId: CART_ID,
  cartVersion: 4,
  campaignId: null,
  stripeSession: SESSION_ID,
  subtotalAmount: new Prisma.Decimal(2500),
  discountAmount: new Prisma.Decimal(0),
  totalAmount: new Prisma.Decimal(2500),
  currency: "RSD",
  status: "PENDING",
  promoCode: null,
  promoUsageCounted: false,
  holderName: null,
  holderPhotoUrl: null,
  checkoutExpiresAt: new Date("2026-07-15T13:00:00.000Z"),
  receiptPdfUrl: null,
  ticketDetails,
  createdAt: new Date("2026-07-15T12:00:00.000Z"),
  updatedAt: new Date("2026-07-15T12:00:00.000Z"),
  fulfillmentError: null,
};

const paidSession = {
  id: SESSION_ID,
  payment_status: "paid",
  amount_total: 250000,
  currency: "rsd",
  metadata: {
    transactionId: TRANSACTION_ID,
    cartId: CART_ID,
    userId: USER_ID,
  },
};

describe("checkout fulfillment integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transactionBoundary.mockImplementation(async (operation) =>
      operation({
        transaction: mocks.transaction,
        issuedTicket: mocks.issuedTicket,
        ticketPrice: mocks.ticketPrice,
        campaign: mocks.campaign,
        cartSessionItem: mocks.cartSessionItem,
        cartSession: mocks.cartSession,
      }),
    );
    mocks.transaction.findUnique.mockResolvedValue(pendingTransaction);
    mocks.issuedTicket.count.mockResolvedValue(0);
    mocks.ticketPrice.findMany.mockResolvedValue([
      {
        id: TICKET_PRICE_ID,
        ticketType: { validityType: "FLEXIBLE_30_DAY" },
      },
    ]);
    mocks.cartSession.findUnique.mockResolvedValue({
      id: CART_ID,
      userId: USER_ID,
      locked: true,
      version: 4,
      activeCheckoutTransactionId: TRANSACTION_ID,
    });
    mocks.issuedTicket.createMany.mockResolvedValue({ count: 2 });
    mocks.transaction.update.mockResolvedValue({ ...pendingTransaction, status: "SUCCESS" });
    mocks.cartSessionItem.deleteMany.mockResolvedValue({ count: 1 });
    mocks.cartSession.updateMany.mockResolvedValue({ count: 1 });
  });

  it("fulfills and clears only the cart bound to the paid transaction", async () => {
    const result = await fulfillPaidCheckout(paidSession as never);

    expect(result).toEqual({
      transaction: expect.objectContaining({ id: TRANSACTION_ID, status: "SUCCESS" }),
      newlyFulfilled: true,
    });
    expect(mocks.transactionBoundary).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
    expect(mocks.transaction.findUnique).toHaveBeenCalledWith({
      where: { stripeSession: SESSION_ID },
    });
    expect(mocks.issuedTicket.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          ticketPriceId: TICKET_PRICE_ID,
          transactionId: TRANSACTION_ID,
          userId: USER_ID,
        }),
      ]),
    });
    expect(mocks.cartSessionItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: CART_ID },
    });
    expect(mocks.cartSession.findUnique).toHaveBeenCalledWith({
      where: { id: CART_ID },
      select: {
        id: true,
        userId: true,
        locked: true,
        version: true,
        activeCheckoutTransactionId: true,
      },
    });
    expect(mocks.cartSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: CART_ID,
        userId: USER_ID,
        locked: true,
        version: 4,
        activeCheckoutTransactionId: TRANSACTION_ID,
      },
      data: {
        locked: false,
        lockedAt: null,
        lockExpiresAt: null,
        activeCheckoutTransactionId: null,
        notified: true,
      },
    });
  });

  it("returns an idempotent result without issuing tickets twice", async () => {
    const successfulTransaction = { ...pendingTransaction, status: "SUCCESS" };
    mocks.transaction.findUnique.mockResolvedValue(successfulTransaction);

    const result = await fulfillPaidCheckout(paidSession as never);

    expect(result).toEqual({
      transaction: successfulTransaction,
      newlyFulfilled: false,
    });
    expect(mocks.issuedTicket.createMany).not.toHaveBeenCalled();
    expect(mocks.cartSessionItem.deleteMany).not.toHaveBeenCalled();
    expect(mocks.campaign.update).not.toHaveBeenCalled();
  });

  it("keeps an already successful transaction idempotent even if replay metadata is missing", async () => {
    const successfulTransaction = { ...pendingTransaction, status: "SUCCESS" };
    mocks.transaction.findUnique.mockResolvedValue(successfulTransaction);

    const result = await fulfillPaidCheckout({ ...paidSession, metadata: {} } as never);

    expect(result).toEqual({
      transaction: successfulTransaction,
      newlyFulfilled: false,
    });
    expect(mocks.transaction.update).not.toHaveBeenCalled();
    expect(mocks.issuedTicket.createMany).not.toHaveBeenCalled();
  });

  it("returns an idempotent result for a payment already in manual review", async () => {
    const reviewTransaction = { ...pendingTransaction, status: "PAID_REVIEW" };
    mocks.transaction.findUnique.mockResolvedValue(reviewTransaction);

    const result = await fulfillPaidCheckout(paidSession as never);

    expect(result).toEqual({
      transaction: reviewTransaction,
      newlyFulfilled: false,
    });
    expect(mocks.transaction.update).not.toHaveBeenCalled();
    expect(mocks.issuedTicket.createMany).not.toHaveBeenCalled();
  });

  it("moves a late paid session after expiry to manual review", async () => {
    const expiredTransaction = { ...pendingTransaction, status: "EXPIRED" };
    mocks.transaction.findUnique.mockResolvedValue(expiredTransaction);
    mocks.transaction.update.mockResolvedValue({ ...expiredTransaction, status: "PAID_REVIEW" });

    const result = await fulfillPaidCheckout(paidSession as never);

    expect(result).toEqual({
      transaction: expect.objectContaining({ status: "PAID_REVIEW" }),
      newlyFulfilled: false,
    });
    expect(mocks.transaction.update).toHaveBeenCalledWith({
      where: { id: TRANSACTION_ID },
      data: {
        status: "PAID_REVIEW",
        fulfillmentError: {
          code: "LATE_PAID_SESSION",
          previousStatus: "EXPIRED",
        },
      },
    });
    expect(mocks.issuedTicket.createMany).not.toHaveBeenCalled();
    expect(mocks.cartSessionItem.deleteMany).not.toHaveBeenCalled();
  });

  it("moves Stripe metadata for a different user to manual review", async () => {
    mocks.transaction.update.mockResolvedValue({ ...pendingTransaction, status: "PAID_REVIEW" });

    const result = await fulfillPaidCheckout({
      ...paidSession,
      metadata: { ...paidSession.metadata, userId: "other-user" },
    } as never);

    expect(result).toEqual({
      transaction: expect.objectContaining({ status: "PAID_REVIEW" }),
      newlyFulfilled: false,
    });
    expect(mocks.transaction.update).toHaveBeenCalledWith({
      where: { id: TRANSACTION_ID },
      data: {
        status: "PAID_REVIEW",
        fulfillmentError: {
          code: "STRIPE_METADATA_MISMATCH",
          expected: {
            transactionId: TRANSACTION_ID,
            cartId: CART_ID,
            userId: USER_ID,
          },
          received: {
            transactionId: TRANSACTION_ID,
            cartId: CART_ID,
            userId: "other-user",
          },
        },
      },
    });
    expect(mocks.issuedTicket.createMany).not.toHaveBeenCalled();
    expect(mocks.cartSessionItem.deleteMany).not.toHaveBeenCalled();
  });

  it("moves missing Stripe checkout metadata to manual review", async () => {
    mocks.transaction.update.mockResolvedValue({ ...pendingTransaction, status: "PAID_REVIEW" });

    const result = await fulfillPaidCheckout({ ...paidSession, metadata: {} } as never);

    expect(result).toEqual({
      transaction: expect.objectContaining({ status: "PAID_REVIEW" }),
      newlyFulfilled: false,
    });
    expect(mocks.issuedTicket.createMany).not.toHaveBeenCalled();
    expect(mocks.cartSessionItem.deleteMany).not.toHaveBeenCalled();
  });

  it("moves a paid session with the wrong currency to manual review", async () => {
    mocks.transaction.update.mockResolvedValue({ ...pendingTransaction, status: "PAID_REVIEW" });

    const result = await fulfillPaidCheckout({ ...paidSession, currency: "eur" } as never);

    expect(result).toEqual({
      transaction: expect.objectContaining({ status: "PAID_REVIEW" }),
      newlyFulfilled: false,
    });
    expect(mocks.transaction.update).toHaveBeenCalledWith({
      where: { id: TRANSACTION_ID },
      data: {
        status: "PAID_REVIEW",
        fulfillmentError: {
          code: "STRIPE_CURRENCY_MISMATCH",
          expected: "rsd",
          received: "eur",
        },
      },
    });
    expect(mocks.issuedTicket.createMany).not.toHaveBeenCalled();
    expect(mocks.cartSessionItem.deleteMany).not.toHaveBeenCalled();
  });

  it("expires a pending transaction and unlocks only its bound cart", async () => {
    mocks.transaction.findUnique.mockResolvedValue(pendingTransaction);
    mocks.transaction.update.mockResolvedValue({ ...pendingTransaction, status: "EXPIRED" });

    const result = await releaseCheckoutSession(SESSION_ID, "EXPIRED");

    expect(result).toEqual({ released: true, cartId: CART_ID });
    expect(mocks.transaction.update).toHaveBeenCalledWith({
      where: { id: TRANSACTION_ID },
      data: { status: "EXPIRED" },
    });
    expect(mocks.cartSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: CART_ID,
        userId: USER_ID,
        locked: true,
        version: 4,
        activeCheckoutTransactionId: TRANSACTION_ID,
      },
      data: {
        locked: false,
        lockedAt: null,
        lockExpiresAt: null,
        activeCheckoutTransactionId: null,
      },
    });
  });
});
