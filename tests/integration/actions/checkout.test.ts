import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  createCheckoutSession: vi.fn(),
  sendOrderConfirmation: vi.fn(),
  transactionFindFirst: vi.fn(),
  stripeRetrieve: vi.fn(),
  stripeExpire: vi.fn(),
  releaseCheckoutSession: vi.fn(),
  fulfillPaidCheckout: vi.fn(),
}));

vi.mock("@/app/(server)/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/app/(server)/lib/stripe-checkout", () => ({
  createCheckoutSession: mocks.createCheckoutSession,
}));

vi.mock("@/app/(server)/lib/prisma", () => ({
  prisma: { transaction: { findFirst: mocks.transactionFindFirst } },
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = {
      sessions: {
        retrieve: mocks.stripeRetrieve,
        expire: mocks.stripeExpire,
      },
    };
  },
}));

vi.mock("@/app/(server)/lib/checkout-fulfillment", () => ({
  releaseCheckoutSession: mocks.releaseCheckoutSession,
  fulfillPaidCheckout: mocks.fulfillPaidCheckout,
}));

vi.mock("@/app/(server)/lib/email", () => ({
  sendOrderConfirmation: mocks.sendOrderConfirmation,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

import {
  cancelCheckoutSessionAction,
  createCheckoutSessionAction,
  resendConfirmationAction,
} from "@/app/(server)/actions/checkout";

const USER_ID = "user-1";
const EMAIL = "kupac@example.com";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
  mocks.getSession.mockResolvedValue({ user: { id: USER_ID, email: EMAIL } });
  mocks.createCheckoutSession.mockResolvedValue({ url: "https://checkout.stripe.test/session" });
});

describe("checkout actions", () => {
  it("derives checkout items from the authenticated server cart instead of client input", async () => {
    const attackerControlledParams = {
      items: [
        {
          ticketPriceId: "11111111-1111-4111-8111-111111111111",
          quantity: 50,
        },
      ],
      campaignId: "attacker-selected-campaign",
      holderName: "Petar Petrović",
      holderPhotoUrl: "https://example.com/petar.webp",
      promoCode: "LETO10",
    };

    const result = await createCheckoutSessionAction(attackerControlledParams);

    expect(result).toEqual({
      success: true,
      data: { url: "https://checkout.stripe.test/session" },
    });
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith({
      userId: USER_ID,
      email: EMAIL,
      holderName: "Petar Petrović",
      holderPhotoUrl: "https://example.com/petar.webp",
      promoCode: "LETO10",
    });
  });

  it("does not resend a confirmation for another user's transaction", async () => {
    mocks.transactionFindFirst.mockResolvedValue(null);

    const result = await resendConfirmationAction("foreign-transaction");

    expect(result).toEqual({
      success: false,
      error: "Narudžbina nije pronađena.",
    });
    expect(mocks.transactionFindFirst).toHaveBeenCalledWith({
      where: { id: "foreign-transaction", userId: USER_ID, status: "SUCCESS" },
      select: { id: true },
    });
    expect(mocks.sendOrderConfirmation).not.toHaveBeenCalled();
  });

  it("cancels the authenticated user's pending Stripe session and unlocks its exact cart", async () => {
    mocks.transactionFindFirst.mockResolvedValue({
      id: "tx-1",
      userId: USER_ID,
      stripeSession: "cs_pending",
      status: "PENDING",
    });
    mocks.stripeRetrieve.mockResolvedValue({
      id: "cs_pending",
      payment_status: "unpaid",
      status: "open",
    });
    mocks.stripeExpire.mockResolvedValue({ id: "cs_pending", status: "expired" });
    mocks.releaseCheckoutSession.mockResolvedValue({ released: true, cartId: "cart-1" });

    const result = await cancelCheckoutSessionAction();

    expect(result).toEqual({ success: true, data: { cancelled: true } });
    expect(mocks.stripeExpire).toHaveBeenCalledWith("cs_pending");
    expect(mocks.releaseCheckoutSession).toHaveBeenCalledWith("cs_pending", "CANCELLED");
  });
});
