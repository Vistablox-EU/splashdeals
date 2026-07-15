/**
 * Pure helpers for /admin/facilities list query params (page, limit, sort).
 * Shared by server FacilitiesList and unit tests.
 */

export const FACILITY_LIST_PAGE_SIZES = [15, 25, 50] as const;
export type FacilityListPageSize = (typeof FACILITY_LIST_PAGE_SIZES)[number];

export const FACILITY_LIST_SORT_KEYS = ["name", "category", "city", "status", "createdAt"] as const;
export type FacilityListSortKey = (typeof FACILITY_LIST_SORT_KEYS)[number];

export type FacilityListSortOrder = "asc" | "desc";

export function parseFacilityListPage(raw?: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function parseFacilityListLimit(raw?: string | null): FacilityListPageSize {
  const n = Number(raw);
  if (FACILITY_LIST_PAGE_SIZES.includes(n as FacilityListPageSize)) {
    return n as FacilityListPageSize;
  }
  return 15;
}

export function parseFacilityListSort(raw?: string | null): FacilityListSortKey {
  if (raw && (FACILITY_LIST_SORT_KEYS as readonly string[]).includes(raw)) {
    return raw as FacilityListSortKey;
  }
  return "createdAt";
}

export function parseFacilityListOrder(raw?: string | null): FacilityListSortOrder {
  return raw === "asc" ? "asc" : "desc";
}

/** Build Prisma orderBy for facility registry. */
export function facilityListOrderBy(
  sort: FacilityListSortKey,
  order: FacilityListSortOrder,
): Record<string, FacilityListSortOrder> {
  return { [sort]: order };
}
