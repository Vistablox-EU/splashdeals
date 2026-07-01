/**
 * 🗺️ Permanently Deleted Legacy Paths
 * Edge-compatible (no Node.js / Prisma imports).
 * Used by middleware to return 404 before the request reaches the app.
 */
export const DELETED_PATHS = new Set([
  "en/facilities/waterpark/petroland",
  "facilities/waterpark/petroland",
  "waterpark/petroland",
  "en/waterpark/petroland",
  "rs/waterpark/petroland",
  "waterpark",
  "en/waterpark",
  "rs/waterpark",
  "facilities/waterpark",
  "en/facilities/waterpark",
  "rs/facilities/waterpark",
]);

export function isDeletedPath(slug: string[]): boolean {
  const path = slug.join("/");
  if (DELETED_PATHS.has(path)) return true;

  // Also check paths with i18n prefix stripped
  if (slug.length > 1 && (slug[0] === "en" || slug[0] === "rs")) {
    return DELETED_PATHS.has(slug.slice(1).join("/"));
  }

  return false;
}
