import { describe, expect, it } from "vitest";
import { isBottomNavAlwaysVisible } from "@/lib/layout/bottom-nav-visibility";

describe("isBottomNavAlwaysVisible", () => {
  it("keeps nav visible on home for conversion + cart badge", () => {
    expect(isBottomNavAlwaysVisible("/", 0)).toBe(true);
  });

  it("keeps nav visible on cart and product purchase surfaces", () => {
    expect(isBottomNavAlwaysVisible("/cart", 0)).toBe(true);
    expect(isBottomNavAlwaysVisible("/cart/success", 0)).toBe(true);
    expect(
      isBottomNavAlwaysVisible("/akva-parkovi/ulaznice/dnevna-karta", 0),
    ).toBe(true);
  });

  it("keeps nav visible when cart has items (facility mini-cart sticky)", () => {
    expect(isBottomNavAlwaysVisible("/petroland", 2)).toBe(true);
    expect(isBottomNavAlwaysVisible("/support", 1)).toBe(true);
  });

  it("allows scroll-hide on content pages with empty cart", () => {
    expect(isBottomNavAlwaysVisible("/support", 0)).toBe(false);
    expect(isBottomNavAlwaysVisible("/akva-parkovi", 0)).toBe(false);
    expect(isBottomNavAlwaysVisible("/how-it-works", 0)).toBe(false);
  });
});
