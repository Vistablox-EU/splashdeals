/**
 * Buyer account URL paths (route groups do NOT appear in the URL).
 * Used by middleware matcher helpers + BottomNav active state.
 */

export const ACCOUNT_PROTECTED_PATH_PREFIXES = [
  "/moje-karte",
  "/omiljeni",
  "/moje-recenzije",
  "/orders",
] as const;

export const ACCOUNT_PUBLIC_PATHS = ["/prijava"] as const;

/** True for any authenticated buyer-account surface (incl. login). */
export function isAccountSurfacePath(pathname: string): boolean {
  if (ACCOUNT_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  return isAccountProtectedPath(pathname);
}

/** True when middleware / server guards must require a session. */
export function isAccountProtectedPath(pathname: string): boolean {
  return ACCOUNT_PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** BottomNav "Nalog" active on any account surface path. */
export function isAccountBottomNavActive(pathname: string): boolean {
  return isAccountSurfacePath(pathname);
}
