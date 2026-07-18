/**
 * When BottomNav must stay visible (no scroll-hide).
 * Purchase surfaces + cart badge routes keep sticky CTAs aligned with the nav.
 * Explore hub (/akva-parkovi) stays visible so discovery + cart entry remain one-thumb.
 */
export function isBottomNavAlwaysVisible(pathname: string, cartItemCount = 0): boolean {
  if (pathname === "/") return true;
  if (pathname === "/cart" || pathname.startsWith("/cart/")) return true;
  // Product detail sticky buy CTA
  if (pathname.includes("/ulaznice/")) return true;
  // Indexable explore hub (BottomNav "Istraži")
  if (pathname === "/akva-parkovi" || pathname.startsWith("/akva-parkovi/")) return true;
  // Facility mini-cart sticky when items are in cart
  if (cartItemCount > 0) return true;
  return false;
}
