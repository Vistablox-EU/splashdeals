import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transactionFindMany: vi.fn(),
  transactionBoundary: vi.fn(),
  releaseCheckoutTransaction: vi.fn(),
  releaseCheckoutSession: vi.fn(),
  fulfillPaidCheckout: vi.fn(),
  stripeRetrieve: vi.fn(),
  stripeExpire: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/app/(server)/lib/prisma", () => ({
  prisma: {
    transaction: { findMany: mocks.transactionFindMany },
    $transaction: mocks.transactionBoundary,
  },
}));
vi.mock("@/app/(server)/lib/checkout-fulfillment", () => ({
  fulfillPaidCheckout: mocks.fulfillPaidCheckout,
  releaseCheckoutSession: mocks.releaseCheckoutSession,
  releaseCheckoutTransaction: mocks.releaseCheckoutTransaction,
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

import { GET } from "@/app/(server)/api/cron/cleanup-sessions/route";

describe("checkout cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    process.env.STRIPE_SECRET_KEY = "«redacted:sk_test_…»";
    mocks.transactionFindMany.mockResolvedValue([
      {
        id: "tx-without-stripe",
        stripeSession: null,
        cartId: "cart-1",
        userId: "user-1",
      },
    ]);
    mocks.releaseCheckoutTransaction.mockResolvedValue({ released: true, cartId: "cart-1" });
  });

  it("fails closed when the cron secret is not configured", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(new Request("https://splashdeals.test/api/cron/cleanup-sessions"));

    expect(response.status).toBe(500);
    expect(mocks.transactionFindMany).not.toHaveBeenCalled();
  });

  it("releases a pre-Stripe checkout only through its exact transaction lock owner", async () => {
    const response = await GET(
      new Request("https://splashdeals.test/api/cron/cleanup-sessions", {
        headers: { authorization: "Bearer cron-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.transactionFindMany).toHaveBeenCalledWith({
      where: {
        status: "PENDING",
        OR: [
          { checkoutExpiresAt: { lte: expect.any(Date) } },
          {
            checkoutExpiresAt: null,
            createdAt: { lt: expect.any(Date) },
          },
        ],
      },
      select: {
        id: true,
        stripeSession: true,
        cartId: true,
        userId: true,
      },
      take: 100,
    });
    expect(mocks.releaseCheckoutTransaction).toHaveBeenCalledWith("tx-without-stripe", "EXPIRED");
    expect(mocks.transactionBoundary).not.toHaveBeenCalled();
  });
});
