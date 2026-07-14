import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/app/(server)/lib/prisma";
import { FacilityShowcaseTemplate } from "@/app/(web)/facility/_components/ShowcaseTemplate";
import { buildFacilityMetadata } from "@/app/(web)/facility/_data/metadata";
import { DiscoveryTemplate, getDiscoveryMetadata } from "@/app/(server)/lib/routing/discovery";
import { resolveFacilitySlug } from "@/app/(server)/lib/routing/resolve-slug";
import {
  isKnownCategory,
  slugToDbValue,
  getAllSlugs,
  getAllEnglishSlugs,
  resolveCategoryKey,
} from "@/lib/routing/categories";
import { slugToName } from "@/lib/routing/categories";
import type { Locale } from "@/lib/locale";

// ── ISR: Revalidate every hour for SEO freshness ────────────────────
export const revalidate = 3600;

// ── Static Paths: Pre-render all facility & category pages ──────────
export async function generateStaticParams() {
  const facilities = await prisma.facility.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true },
  });
  const facilityPaths = facilities.map((f) => ({ categorySlug: f.slug }));
  const srCategoryPaths = getAllSlugs().map((s) => ({ categorySlug: s }));
  const enCategoryPaths = getAllEnglishSlugs().map((s) => ({ categorySlug: s }));
  return [...facilityPaths, ...srCategoryPaths, ...enCategoryPaths];
}

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

/**
 * Determine locale from slug.
 * English slugs resolve via resolveCategoryKey — if the slug maps to a known
 * English category, the locale is "en". Otherwise "sr".
 */
function detectLocale(slug: string): Locale {
  const key = resolveCategoryKey(slug);
  if (!key || key === slug.toLowerCase()) return "sr";
  return "en";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const locale = detectLocale(categorySlug);

  // Try as category first (works with both sr and en slugs)
  if (isKnownCategory(categorySlug.toLowerCase())) {
    return await getDiscoveryMetadata(categorySlug);
  }

  // Try as category via DB lookup
  const dbValue = slugToDbValue(categorySlug);
  const hasCategory = await prisma.facility.findFirst({
    where: { category: { equals: dbValue ?? categorySlug, mode: "insensitive" } },
    select: { id: true },
  });

  if (hasCategory) {
    return await getDiscoveryMetadata(categorySlug);
  }

  // Try as facility slug
  const facility = await resolveFacilitySlug(categorySlug, locale);
  if (facility) {
    return await buildFacilityMetadata(categorySlug, facility.category);
  }

  notFound();
}

export default async function CategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;
  const locale = detectLocale(categorySlug);

  // Try as category first (works with both sr and en slugs)
  if (isKnownCategory(categorySlug.toLowerCase())) {
    const resolvedSlug = resolveCategoryKey(categorySlug) || categorySlug;
    return <DiscoveryTemplate params={Promise.resolve({ categorySlug: resolvedSlug })} />;
  }

  // Try as category via DB lookup
  const dbValue = slugToDbValue(categorySlug);
  const hasCategory = await prisma.facility.findFirst({
    where: { category: { equals: dbValue ?? categorySlug, mode: "insensitive" } },
    select: { id: true },
  });

  if (hasCategory) {
    return (
      <DiscoveryTemplate
        params={Promise.resolve({ categorySlug: resolveCategoryKey(categorySlug) || categorySlug })}
      />
    );
  }

  // Try as facility slug
  const facility = await resolveFacilitySlug(categorySlug, locale);
  if (facility) {
    return (
      <FacilityShowcaseTemplate
        params={Promise.resolve({
          categorySlug: facility.category,
          facilitySlug: categorySlug,
        })}
      />
    );
  }

  notFound();
}
