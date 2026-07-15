import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  stripeSessionCreate: vi.fn(),
  stripeSessionExpire: vi.fn(),
  couponCreate: vi.fn(),
  transactionBoundary: vi.fn(),
  cartSession: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  cartSessionItem: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  ticketPrice: {
    findMany: vi.fn(),
  },
  transaction: {
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  campaign: {
    findUnique: vi.fn(),
  },
}));

vi.mock("server-only", () => ({}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = {
      sessions: {
        create: mocks.stripeSessionCreate,
        expire: mocks.stripeSessionExpire,
      },
    };
    coupons = { create: mocks.couponCreate };
  },
}));

vi.mock("@/app/(server)/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transactionBoundary,
    cartSession: mocks.cartSession,
    cartSessionItem: mocks.cartSessionItem,
    ticketPrice: mocks.ticketPrice,
    transaction: mocks.transaction,
    campaign: mocks.campaign,
  },
}));

vi.mock("@/app/(server)/lib/stripe-utils", () => ({
  generateIdempotencyKey: vi.fn(() => "checkout-idempotency-key"),
  withStripeRetry: vi.fn(async (operation: () => Promise<unknown>) => operation()),
}));

vi.mock("@/lib/dictionaries", () => ({
  getDictionary: vi.fn(async () => ({
    validations: {
      ticket_unavailable: "Izabrana karta više nije dostupna.",
      identity_required: "Podaci o vlasniku karte su obavezni.",
      promo_invalid: "Promo kod nije važeći.",
    },
  })),
}));

vi.mock("@/app/(server)/actions/campaigns", () => ({
  validatePromoCodeAction: vi.fn(),
}));

import { createCheckoutSession } from "@/app/(server)/lib/stripe-checkout";

const USER_ID = "user-1";
const CART_ID = "77777777-7777-4777-8777-777777777777";
const CART_ITEM_ID = "88888888-8888-4888-8888-888888888888";
const TRANSACTION_ID = "99999999-9999-4999-8999-999999999999";
const TICKET_PRICE_ID = "11111111-1111-4111-8111-111111111111";
const FACILITY_ID = "22222222-2222-4222-8222-222222222222";
const EMAIL = "kupac@example.com";

const cart = {
  id: CART_ID,
  userId: USER_ID,
  locked: false,
  lockedAt: null,
  lockExpiresAt: null,
  activeCheckoutTransactionId: null,
  version: 3,
  cartItems: [
    {
      id: CART_ITEM_ID,
      cartId: CART_ID,
      ticketPriceId: TICKET_PRICE_ID,
      quantity: 2,
    },
  ],
};

const canonicalTicket = {
  id: TICKET_PRICE_ID,
  isActive: true,
  price: new Prisma.Decimal(1250),
  label: "Radni dan",
  dayType: "WEEKDAY",
  timeSlot: "FULL_DAY",
  validFrom: null,
  validTo: null,
  saleStart: null,
  saleEnd: null,
  ticketType: {
    title: "Odrasli",
    isActive: true,
    requiresIdentity: false,
    requiresPhoto: false,
    minPeople: 1,
    maxPeople: 5,
    validityType: "FLEXIBLE_30_DAY",
    category: {
      isActive: true,
      facility: {
        id: FACILITY_ID,
        name: "Gradski bazen",
        status: "ACTIVE",
      },
    },
  },
};

describe("Stripe checkout integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
    process.env.NEXT_PUBLIC_SITE_URL = "https://splashdeals.test";

    mocks.transactionBoundary.mockImplementation(async (operation) =>
      operation({
        cartSession: mocks.cartSession,
        cartSessionItem: mocks.cartSessionItem,
        ticketPrice: mocks.ticketPrice,
        transaction: mocks.transaction,
        campaign: mocks.campaign,
      }),
    );
    mocks.cartSession.findUnique.mockResolvedValue(cart);
    mocks.ticketPrice.findMany.mockResolvedValue([canonicalTicket]);
    mocks.transaction.create.mockResolvedValue({ id: TRANSACTION_ID });
    mocks.transaction.update.mockResolvedValue({ id: TRANSACTION_ID });
    mocks.transaction.updateMany.mockResolvedValue({ count: 1 });
    mocks.cartSession.updateMany.mockResolvedValue({ count: 1 });
    mocks.stripeSessionExpire.mockResolvedValue({ id: "expired" });
    mocks.stripeSessionCreate.mockResolvedValue({
      id: "cs_test_exact_cart",
      url: "https://checkout.stripe.test/exact-cart",
      amount_total: 250000,
      currency: "rsd",
      expires_at: 1_784_112_400,
    });
  });

  it("reserves the authenticated cart and binds its exact identity to Stripe and the transaction", async () => {
    const result = await createCheckoutSession({
      userId: USER_ID,
      email: EMAIL,
    });

    expect(result).toEqual({ url: "https://checkout.stripe.test/exact-cart" });
    expect(mocks.cartSession.findUnique).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      include: { cartItems: true },
    });
    expect(mocks.transactionBoundary).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
    expect(mocks.cartSession.updateMany).toHaveBeenCalledWith({
      where: { id: CART_ID, version: 3, locked: false },
      data: {
        locked: true,
        lockedAt: expect.any(Date),
        lockExpiresAt: expect.any(Date),
        activeCheckoutTransactionId: TRANSACTION_ID,
        version: { increment: 1 },
      },
    });
    expect(mocks.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: USER_ID,
        cartId: CART_ID,
        cartVersion: 4,
        facilityId: FACILITY_ID,
        stripeSession: null,
        status: "PENDING",
        subtotalAmount: new Prisma.Decimal(2500),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(2500),
      }),
      select: { id: true },
    });
    expect(mocks.stripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            quantity: 2,
            price_data: expect.objectContaining({ unit_amount: 125000 }),
          }),
        ],
        metadata: expect.objectContaining({
          cartId: CART_ID,
          transactionId: TRANSACTION_ID,
          userId: USER_ID,
        }),
        cancel_url: "https://splashdeals.test/cart?checkout=cancelled",
      }),
      { idempotencyKey: "checkout-idempotency-key" },
    );
    expect(mocks.transaction.update).toHaveBeenCalledWith({
      where: { id: TRANSACTION_ID },
      data: expect.objectContaining({
        stripeSession: "cs_test_exact_cart",
        checkoutExpiresAt: new Date(1_784_112_400 * 1000),
      }),
    });
  });

  it("applies the canonical promo as an exact Stripe amount-off coupon", async () => {
    mocks.campaign.findUnique.mockResolvedValue({
      id: "campaign-1",
      code: "LETO10",
      isActive: true,
      validFrom: new Date("2026-01-01T00:00:00.000Z"),
      validTo: new Date("2027-01-01T00:00:00.000Z"),
      usageLimit: 10,
      usedCount: 0,
      minPurchaseAmount: null,
      discountPercent: new Prisma.Decimal(10),
      facilityRestrictions: [],
    });
    mocks.transaction.count.mockResolvedValue(0);
    mocks.couponCreate.mockResolvedValue({ id: "coupon-leto10" });
    mocks.stripeSessionCreate.mockResolvedValue({
      id: "cs_discounted",
      url: "https://checkout.stripe.test/discounted",
      amount_total: 225000,
      currency: "rsd",
      expires_at: 1_784_112_400,
    });

    await createCheckoutSession({ userId: USER_ID, email: EMAIL, promoCode: "leto10" });

    expect(mocks.couponCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: "once",
        amount_off: 25000,
        currency: "rsd",
        name: "LETO10",
      }),
      { idempotencyKey: "checkout-idempotency-key" },
    );
    expect(mocks.couponCreate.mock.calls[0]?.[0]).not.toHaveProperty("percent_off");
  });

  it("does not reserve a promo code after its successful-use limit is exhausted", async () => {
    mocks.campaign.findUnique.mockResolvedValue({
      id: "campaign-1",
      code: "LETO10",
      isActive: true,
      validFrom: new Date("2026-01-01T00:00:00.000Z"),
      validTo: new Date("2027-01-01T00:00:00.000Z"),
      usageLimit: 1,
      usedCount: 1,
      minPurchaseAmount: null,
      discountPercent: new Prisma.Decimal(10),
      facilityRestrictions: [],
    });
    mocks.transaction.count.mockResolvedValue(0);
    mocks.couponCreate.mockResolvedValue({ id: "coupon-leto10" });
    mocks.stripeSessionCreate.mockResolvedValue({
      id: "cs_should_not_exist",
      url: "https://checkout.stripe.test/should-not-exist",
      amount_total: 225000,
      expires_at: 1_784_112_400,
    });

    await expect(
      createCheckoutSession({
        userId: USER_ID,
        email: EMAIL,
        promoCode: "LETO10",
      }),
    ).rejects.toThrow("Promo kod je dostigao maksimalan broj korišćenja.");

    expect(mocks.stripeSessionCreate).not.toHaveBeenCalled();
    expect(mocks.transaction.create).not.toHaveBeenCalled();
  });

  it("fails closed and releases the exact cart when Stripe returns a different total", async () => {
    mocks.stripeSessionCreate.mockResolvedValue({
      id: "cs_wrong_total",
      url: "https://checkout.stripe.test/wrong-total",
      amount_total: 249999,
      currency: "rsd",
      expires_at: 1_784_112_400,
    });

    await expect(createCheckoutSession({ userId: USER_ID, email: EMAIL })).rejects.toThrow(
      "Iznos za plaćanje se ne poklapa sa sadržajem korpe.",
    );

    expect(mocks.stripeSessionExpire).toHaveBeenCalledTimes(1);
    expect(mocks.stripeSessionExpire).toHaveBeenCalledWith("cs_wrong_total");
    expect(mocks.transaction.updateMany).toHaveBeenCalledWith({
      where: { id: TRANSACTION_ID, status: "PENDING" },
      data: { status: "FAILED" },
    });
    expect(mocks.cartSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: CART_ID,
        version: 4,
        activeCheckoutTransactionId: TRANSACTION_ID,
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

  it("fails closed when Stripe creates a session in the wrong currency", async () => {
    mocks.stripeSessionCreate.mockResolvedValue({
      id: "cs_wrong_currency",
      url: "https://checkout.stripe.test/wrong-currency",
      amount_total: 250000,
      currency: "eur",
      expires_at: 1_784_112_400,
    });

    await expect(createCheckoutSession({ userId: USER_ID, email: EMAIL })).rejects.toThrow(
      "Valuta plaćanja se ne poklapa sa sadržajem korpe.",
    );

    expect(mocks.stripeSessionExpire).toHaveBeenCalledWith("cs_wrong_currency");
    expect(mocks.transaction.updateMany).toHaveBeenCalledWith({
      where: { id: TRANSACTION_ID, status: "PENDING" },
      data: { status: "FAILED" },
    });
  });
});
