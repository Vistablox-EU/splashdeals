/**
 * When BottomNav must stay visible (no scroll-hide).
 * Purchase surfaces + cart badge routes keep sticky CTAs aligned with the nav.
 */
export function isBottomNavAlwaysVisible(pathname: string, cartItemCount = 0): boolean {
  if (pathname === "/") return true;
  if (pathname === "/cart" || pathname.startsWith("/cart/")) return true;
  // Product detail sticky buy CTA
  if (pathname.includes("/ulaznice/")) return true;
  // Facility mini-cart sticky when items are in cart
  if (cartItemCount > 0) return true;
  return false;
}
