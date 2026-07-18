/**
 * Active-state rules for mobile BottomNav items.
 *
 * - `/` is active only on exact home
 * - hash links like `/#deals` are never marked active by pathname alone
 * - explore hub `/akva-parkovi` uses prefix match (category listing + subpaths)
 * - other paths use prefix match
 */
export function isBottomNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
