/**
 * 🔍 Shared Slug Resolution
 * Single source of truth for resolving path segments into category or facility types.
 * Used by both the catch-all route ([...slug]/page.tsx) and the category route ([categorySlug]/page.tsx).
 */
import { prisma } from "@/app/(server)/lib/prisma";
import {
  resolveCategoryKey,
  slugToDbValue,
  isKnownCategory,
  dbValueToSlug,
  getLocalizedSlug,
} from "@/lib/routing/categories";
import type { Locale } from "@/lib/locale";

export type ResolvedType =
  | { type: "category"; category: string; locale: Locale }
  | { type: "facility"; category: string; locale: Locale }
  | null;

/**
 * Resolve a single path segment to determine if it's a known category or facility slug.
 * Accepts both Serbian and English slugs.
 *
 * Resolution order:
 * 1. Known category slug (from registry, any locale) with DB confirmation
 * 2. Known category slug (from registry, even if DB is empty — e.g. CI)
 * 3. Active facility slug (Prisma lookup)
 */
export async function resolveSlug(firstSlug: string, locale: Locale = "sr"): Promise<ResolvedType> {
  // Map English slug to Serbian key for DB lookup
  const srKey = resolveCategoryKey(firstSlug);
  const canonicalSlug = srKey ?? firstSlug;
  const dbValue = slugToDbValue(canonicalSlug);

  // 1. Check if category (DB has facilities matching the mapped value)
  if (dbValue) {
    const hasCategory = await prisma.facility.findFirst({
      where: { category: { equals: dbValue, mode: "insensitive" } },
      select: { category: true },
    });
    if (hasCategory) {
      return { type: "category", category: canonicalSlug, locale };
    }
  }

  // 2. Check known category slugs (any locale)
  if (isKnownCategory(canonicalSlug)) {
    return { type: "category", category: canonicalSlug, locale };
  }

  // 3. Check if facility (facility slugs are the same across locales)
  const facility = await prisma.facility.findUnique({
    where: { slug: firstSlug, status: "ACTIVE" },
    select: { slug: true, category: true },
  });
  if (facility) {
    const catSlug =
      dbValueToSlug(facility.category!) ?? facility.category!.toLowerCase().replace(/\s+/g, "-");
    return { type: "facility", category: catSlug, locale };
  }

  return null;
}

/**
 * Quick check: is a path segment a known facility?
 * Bypasses the category check for direct slug resolution.
 */
export async function resolveFacilitySlug(slug: string, locale: Locale = "sr") {
  const facility = await prisma.facility.findUnique({
    where: { slug, status: "ACTIVE" },
    select: { slug: true, category: true },
  });
  if (facility) {
    const cat = getLocalizedSlug(
      facility.category?.toLowerCase().replace(/\s+/g, "-") || "",
      locale,
    );
    return { slug: facility.slug, category: cat };
  }
  return null;
}

/**
 * Legacy /en/ and /rs/ prefix resolver.
 * Given a legacy path array, resolves the final clean facility URL.
 */
export async function resolveLegacyTarget(slugs: string[]): Promise<string | null> {
  // Strip the prefix
  const cleanSegments = slugs.slice(1);
  if (cleanSegments.length === 0) return "/";

  // Check the last segment as a facility slug
  const lastSegment = cleanSegments[cleanSegments.length - 1];
  const facility = await prisma.facility.findUnique({
    where: { slug: lastSegment, status: "ACTIVE" },
    select: { slug: true },
  });
  if (facility) {
    return "/" + facility.slug;
  }

  return null;
}
