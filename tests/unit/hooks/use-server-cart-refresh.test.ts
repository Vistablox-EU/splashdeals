import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  getCartAction: vi.fn(),
}));

vi.mock("@/app/(server)/actions/cart", () => ({
  getCartAction: mocks.getCartAction,
}));

import { useServerCart } from "@/hooks/use-server-cart";

describe("useServerCart refresh generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useServerCart.setState({
      items: [],
      isLoading: false,
      isHydrated: false,
      totalItems: 0,
      totalPrice: 0,
      refreshGeneration: 0,
    });
  });

  it("ignores stale getCart responses when a newer refresh completed first", async () => {
    let resolveSlow: (value: unknown) => void = () => undefined;
    const slow = new Promise((resolve) => {
      resolveSlow = resolve;
    });

    mocks.getCartAction
      .mockImplementationOnce(() => slow)
      .mockResolvedValueOnce({
        success: true,
        data: {
          items: [
            {
              id: "kept",
              ticketId: "t1",
              quantity: 1,
              title: "Kept",
              price: 100,
              currency: "RSD",
              facilityId: "f1",
              updatedAt: Date.now(),
            },
          ],
        },
      });

    const slowPromise = useServerCart.getState().refresh();
    const fastPromise = useServerCart.getState().refresh();

    await fastPromise;
    expect(useServerCart.getState().items.map((i) => i.id)).toEqual(["kept"]);

    // Stale response returns old multi-item cart — must not overwrite.
    resolveSlow({
      success: true,
      data: {
        items: [
          {
            id: "removed",
            ticketId: "t0",
            quantity: 1,
            title: "Should not reappear",
            price: 100,
            currency: "RSD",
            facilityId: "f1",
            updatedAt: Date.now(),
          },
          {
            id: "kept",
            ticketId: "t1",
            quantity: 1,
            title: "Kept",
            price: 100,
            currency: "RSD",
            facilityId: "f1",
            updatedAt: Date.now(),
          },
        ],
      },
    });
    await slowPromise;

    expect(useServerCart.getState().items.map((i) => i.id)).toEqual(["kept"]);
  });
});
