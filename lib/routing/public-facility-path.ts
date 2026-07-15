/**
 * Public facility path on the buyer site.
 * Admin historically used `/facilities/{category}/{slug}` which 404s.
 */
export function buildPublicFacilityPath(slug: string): string {
  const clean = (slug || "").trim().replace(/^\/+/, "");
  if (!clean) return "/";
  return `/${clean}`;
}
