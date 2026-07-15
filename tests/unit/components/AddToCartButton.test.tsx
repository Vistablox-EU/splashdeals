/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addToCartAction: vi.fn(),
  openCart: vi.fn(),
  trackAddToCart: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  refresh: vi.fn().mockResolvedValue([]),
  broadcastCartUpdated: vi.fn(),
  openCartIfDesktop: vi.fn((openCart: () => void) => openCart()),
}));

vi.mock("@/app/(server)/actions/cart", () => ({
  addToCartAction: mocks.addToCartAction,
}));

vi.mock("@/hooks/use-ui-state", () => ({
  useUIState: (selector: (state: { openCart: typeof mocks.openCart }) => unknown) =>
    selector({ openCart: mocks.openCart }),
}));

vi.mock("@/hooks/use-server-cart", () => ({
  useServerCart: (selector: (state: { refresh: typeof mocks.refresh }) => unknown) =>
    selector({ refresh: mocks.refresh }),
}));

vi.mock("@/lib/analytics/events", () => ({
  trackAddToCart: mocks.trackAddToCart,
}));

vi.mock("@/lib/client-dictionaries", () => ({
  getClientDictionary: vi.fn(async () => ({})),
}));

vi.mock("@/lib/cart/cart-sync", () => ({
  broadcastCartUpdated: mocks.broadcastCartUpdated,
}));

vi.mock("@/lib/cart/open-cart-if-desktop", () => ({
  openCartIfDesktop: mocks.openCartIfDesktop,
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

import { AddToCartButton } from "@/components/cart/AddToCartButton";

const ticket = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Gradski bazen - Odrasli",
  price: 1250,
  currency: "RSD",
  validityType: "FLEXIBLE_30_DAY",
  requiresIdentity: false,
  requiresPhoto: false,
  minPeople: 1,
  maxPeople: 5,
  imageUrl: null,
  facility: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Gradski bazen",
    category: "Bazen",
  },
};

describe("AddToCartButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows an error and does not report success when persistence fails", async () => {
    mocks.addToCartAction.mockResolvedValue({
      success: false,
      error: "Korpa trenutno nije dostupna.",
    });

    render(<AddToCartButton ticket={ticket} />);
    fireEvent.click(screen.getByRole("button", { name: /Dodaj Gradski bazen/i }));

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("Korpa trenutno nije dostupna.");
    });

    expect(mocks.addToCartAction).toHaveBeenCalledWith({
      ticketPriceId: ticket.id,
      quantity: 1,
    });
    expect(mocks.trackAddToCart).not.toHaveBeenCalled();
    expect(mocks.openCartIfDesktop).not.toHaveBeenCalled();
    expect(mocks.openCart).not.toHaveBeenCalled();
  });

  it("refreshes cart and uses desktop-gated open after successful add", async () => {
    mocks.addToCartAction.mockResolvedValue({
      success: true,
      data: {
        item: {
          id: "item-1",
          ticketId: ticket.id,
          title: ticket.title,
          price: ticket.price,
          facilityName: ticket.facility.name,
          quantity: 1,
        },
      },
    });

    render(<AddToCartButton ticket={ticket} />);
    fireEvent.click(screen.getByRole("button", { name: /Dodaj Gradski bazen/i }));

    await waitFor(() => {
      expect(mocks.refresh).toHaveBeenCalled();
    });
    expect(mocks.broadcastCartUpdated).toHaveBeenCalled();
    expect(mocks.openCartIfDesktop).toHaveBeenCalledWith(mocks.openCart);
    expect(mocks.toastSuccess).toHaveBeenCalled();
  });
});
