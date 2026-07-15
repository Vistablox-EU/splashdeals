import { describe, expect, it } from "vitest";
import { getCartTotalItems, getCartTotalPrice } from "@/lib/cart/cart-totals";
import type { CartItem } from "@/lib/types/cart";

const items: CartItem[] = [
  {
    id: "1",
    ticketId: "t1",
    quantity: 2,
    title: "A",
    price: 1000,
    currency: "RSD",
    facilityId: "f1",
    facilityName: "Park",
    category: "Bazen",
    validityType: "FLEXIBLE_30_DAY",
    requiresIdentity: false,
    requiresPhoto: false,
    imageUrl: null,
    minPeople: 1,
    maxPeople: 5,
    updatedAt: Date.now(),
  },
  {
    id: "2",
    ticketId: "t2",
    quantity: 1,
    title: "B",
    price: 500,
    currency: "RSD",
    facilityId: "f1",
    facilityName: "Park",
    category: "Bazen",
    validityType: "FLEXIBLE_30_DAY",
    requiresIdentity: false,
    requiresPhoto: false,
    imageUrl: null,
    minPeople: 1,
    maxPeople: 5,
    updatedAt: Date.now(),
  },
];

describe("cart totals", () => {
  it("sums item quantities for badge counts", () => {
    expect(getCartTotalItems(items)).toBe(3);
    expect(getCartTotalItems([])).toBe(0);
  });

  it("sums price * quantity for drawer totals", () => {
    expect(getCartTotalPrice(items)).toBe(2500);
    expect(getCartTotalPrice([])).toBe(0);
  });
});
