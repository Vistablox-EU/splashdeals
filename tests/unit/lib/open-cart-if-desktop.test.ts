/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDesktopViewport, openCartIfDesktop } from "@/lib/cart/open-cart-if-desktop";

describe("openCartIfDesktop", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("opens cart on desktop viewports", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("min-width"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }));

    const openCart = vi.fn();
    expect(isDesktopViewport()).toBe(true);
    openCartIfDesktop(openCart);
    expect(openCart).toHaveBeenCalledOnce();
  });

  it("does not open cart on mobile viewports", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }));

    const openCart = vi.fn();
    expect(isDesktopViewport()).toBe(false);
    openCartIfDesktop(openCart);
    expect(openCart).not.toHaveBeenCalled();
  });
});
