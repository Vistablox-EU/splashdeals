import { describe, expect, it } from "vitest";
import { getCartCountForTier } from "@/lib/cart/cart-count-for-tier";

describe("getCartCountForTier", () => {
  const items = [
    { ticketId: "price-a", quantity: 2, title: "Park - DECA (Radni dan)" },
    { ticketId: "price-b", quantity: 1, title: "Park - ODRASLI" },
  ];

  it("sums quantities for price ids belonging to the tier", () => {
    const map = {
      "tier-deca": { prices: [{ id: "price-a" }, { id: "price-c" }] },
    };
    expect(getCartCountForTier(items, "tier-deca", map)).toBe(2);
  });

  it("returns 0 when no matching prices", () => {
    const map = { "tier-x": { prices: [{ id: "price-z" }] } };
    expect(getCartCountForTier(items, "tier-x", map)).toBe(0);
  });

  it("falls back to title match when map missing", () => {
    expect(getCartCountForTier(items, "tier-deca", null, "DECA", "DECA")).toBe(2);
  });
});
