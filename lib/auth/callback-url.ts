/**
 * Auth return-path helpers for /prijava (uses `callbackUrl` query param,
 * matching SignInButtons + middleware conventions).
 */

/** Only allow same-origin relative paths (no protocol-relative // or external). */
export function isSafeCallbackPath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  return true;
}

/** Build /prijava?callbackUrl=... for post-login return. */
export function buildPrijavaUrl(callbackPath: string): string {
  const safe = isSafeCallbackPath(callbackPath) ? callbackPath : "/moje-karte";
  return `/prijava?callbackUrl=${encodeURIComponent(safe)}`;
}

/** Success page return path preserving Stripe session_id when present. */
export function buildSuccessReturnPath(sessionId?: string | null): string {
  if (sessionId && /^[A-Za-z0-9_=-]+$/.test(sessionId)) {
    return `/success?session_id=${encodeURIComponent(sessionId)}`;
  }
  return "/success";
}

export function buildSuccessPrijavaUrl(sessionId?: string | null): string {
  return buildPrijavaUrl(buildSuccessReturnPath(sessionId));
}
