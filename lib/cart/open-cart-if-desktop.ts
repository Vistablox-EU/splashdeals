/** Matches Tailwind `md` breakpoint used across cart chrome. */
export const DESKTOP_MIN_WIDTH = 768;

/**
 * Desktop keeps the side CartDrawer; mobile uses a single destination: `/cart`
 * (bottom nav). Evaluate at call time so click handlers don't race hydration.
 */
export function isDesktopViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`).matches;
}

/** Open the drawer only on desktop viewports. */
export function openCartIfDesktop(openCart: () => void): void {
  if (isDesktopViewport()) openCart();
}
