import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  transactionFindFirst: vi.fn(),
  stripeRetrieve: vi.fn(),
  fulfillPaidCheckout: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/app/(server)/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));
vi.mock("@/app/(server)/lib/prisma", () => ({
  prisma: { transaction: { findFirst: mocks.transactionFindFirst } },
}));
vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = { sessions: { retrieve: mocks.stripeRetrieve } };
  },
}));
vi.mock("@/app/(server)/lib/checkout-fulfillment", () => ({
  fulfillPaidCheckout: mocks.fulfillPaidCheckout,
}));

import { GET } from "@/app/(server)/api/checkout/status/route";

describe("checkout status endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(null);
    mocks.transactionFindFirst.mockResolvedValue({
      id: "tx-1",
      userId: "user-1",
      stripeSession: "cs_test_private",
      status: "SUCCESS",
      issuedTickets: [],
    });
  });

  it("does not expose transaction or ticket data to an unauthenticated caller", async () => {
    const response = await GET(
      new Request("https://splashdeals.test/api/checkout/status?session_id=cs_test_private"),
    );

    expect(response.status).toBe(401);
    expect(mocks.transactionFindFirst).not.toHaveBeenCalled();
    expect(mocks.stripeRetrieve).not.toHaveBeenCalled();
  });

  it("returns a minimal ticket DTO only for the authenticated owner", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.transactionFindFirst.mockResolvedValue({
      id: "tx-1",
      userId: "user-1",
      cartId: "private-cart-id",
      stripeSession: "cs_test_private",
      status: "SUCCESS",
      totalAmount: 2500,
      issuedTickets: [
        {
          id: "issued-1",
          qrHash: "private-qr",
          ticketPrice: {
            label: "Radni dan",
            ticketType: {
              title: "Odrasli",
              category: {
                facility: { name: "Gradski bazen", city: "Niš" },
              },
            },
          },
        },
      ],
    });

    const response = await GET(
      new Request("https://splashdeals.test/api/checkout/status?session_id=cs_test_private"),
    );

    expect(response.status).toBe(200);
    expect(mocks.transactionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSession: "cs_test_private", userId: "user-1" },
      }),
    );
    expect(await response.json()).toEqual({
      id: "tx-1",
      status: "SUCCESS",
      totalAmount: 2500,
      issuedTickets: [
        {
          id: "issued-1",
          qrHash: "private-qr",
          ticket: {
            title: "Odrasli",
            description: "Radni dan",
            facility: { name: "Gradski bazen", location: "Niš" },
          },
        },
      ],
    });
  });
});
