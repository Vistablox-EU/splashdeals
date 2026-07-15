import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  fulfillPaidCheckout: vi.fn(),
  releaseCheckoutSession: vi.fn(),
  after: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    webhooks = { constructEvent: mocks.constructEvent };
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "Stripe-Signature": "test-signature" })),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      }),
  },
  after: mocks.after,
}));

vi.mock("@/app/(server)/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/app/(server)/lib/checkout-fulfillment", () => ({
  fulfillPaidCheckout: mocks.fulfillPaidCheckout,
  releaseCheckoutSession: mocks.releaseCheckoutSession,
}));
vi.mock("@/app/(server)/lib/email", () => ({
  sendEmail: vi.fn(),
  sendOrderConfirmation: vi.fn(),
}));
vi.mock("@/lib/dictionaries", () => ({ getDictionary: vi.fn() }));
vi.mock("qrcode", () => ({ default: { toDataURL: vi.fn() } }));

import { POST } from "@/app/(server)/api/webhooks/stripe/route";

const paidSession = {
  id: "cs_test_paid",
  payment_status: "paid",
  amount_total: 250000,
  metadata: { transactionId: "tx-1", cartId: "cart-1" },
};

describe("Stripe webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_placeholder";
    mocks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: paidSession },
    });
  });

  it("releases the exact checkout after an asynchronous payment failure", async () => {
    const failedSession = { id: "cs_async_failed" };
    mocks.constructEvent.mockReturnValue({
      type: "checkout.session.async_payment_failed",
      data: { object: failedSession },
    });
    mocks.releaseCheckoutSession.mockResolvedValue({ released: true, cartId: "cart-1" });

    const response = await POST(
      new Request("https://splashdeals.test/api/webhooks/stripe", {
        method: "POST",
        body: "signed-body",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.releaseCheckoutSession).toHaveBeenCalledWith("cs_async_failed", "FAILED");
  });

  it("returns a retryable 500 when durable fulfillment fails", async () => {
    mocks.fulfillPaidCheckout.mockRejectedValue(new Error("database unavailable"));

    const response = await POST(
      new Request("https://splashdeals.test/api/webhooks/stripe", {
        method: "POST",
        body: "signed-body",
      }),
    );

    expect(response.status).toBe(500);
    expect(mocks.fulfillPaidCheckout).toHaveBeenCalledWith(paidSession);
    expect(mocks.after).not.toHaveBeenCalled();
  });
});
