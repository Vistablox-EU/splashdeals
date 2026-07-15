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
import type { Locale } from "@/lib/locale";

// ── ISR: Revalidate every hour for SEO freshness ────────────────────
export const revalidate = 3600;

/**
 * Pre-render category + facility paths when Neon is reachable.
 * On DB/control-plane failure (common during Vercel build), fall back to
 * code-only category slugs so the deploy still succeeds. Facility pages
 * remain available on-demand via dynamicParams + ISR.
 */
export async function generateStaticParams() {
  const srCategoryPaths = getAllSlugs().map((s) => ({ categorySlug: s }));
  const enCategoryPaths = getAllEnglishSlugs().map((s) => ({ categorySlug: s }));
  const categoryPaths = [...srCategoryPaths, ...enCategoryPaths];

  try {
    const facilities = await prisma.facility.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true },
    });
    const facilityPaths = facilities.map((f) => ({ categorySlug: f.slug }));
    return [...facilityPaths, ...categoryPaths];
  } catch (error) {
    console.warn(
      "[generateStaticParams] DB unavailable during build — pre-rendering known categories only:",
      error instanceof Error ? error.message : error,
    );
    return categoryPaths;
  }
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

  if (isKnownCategory(categorySlug.toLowerCase())) {
    return await getDiscoveryMetadata(categorySlug);
  }

  let mode: "category" | "facility" | null = null;
  let facilityCategory: string | null = null;

  try {
    const dbValue = slugToDbValue(categorySlug);
    const hasCategory = await prisma.facility.findFirst({
      where: { category: { equals: dbValue ?? categorySlug, mode: "insensitive" } },
      select: { id: true },
    });

    if (hasCategory) {
      mode = "category";
    } else {
      const facility = await resolveFacilitySlug(categorySlug, locale);
      if (facility) {
        mode = "facility";
        facilityCategory = facility.category;
      }
    }
  } catch (error) {
    console.warn(
      "[generateMetadata] DB error for slug",
      categorySlug,
      error instanceof Error ? error.message : error,
    );
  }

  if (mode === "category") {
    return await getDiscoveryMetadata(categorySlug);
  }
  if (mode === "facility" && facilityCategory) {
    return await buildFacilityMetadata(categorySlug, facilityCategory);
  }

  notFound();
}

export default async function CategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;
  const locale = detectLocale(categorySlug);

  if (isKnownCategory(categorySlug.toLowerCase())) {
    const resolvedSlug = resolveCategoryKey(categorySlug) || categorySlug;
    return <DiscoveryTemplate params={Promise.resolve({ categorySlug: resolvedSlug })} />;
  }

  let mode: "category" | "facility" | null = null;
  let facilityCategory: string | null = null;

  try {
    const dbValue = slugToDbValue(categorySlug);
    const hasCategory = await prisma.facility.findFirst({
      where: { category: { equals: dbValue ?? categorySlug, mode: "insensitive" } },
      select: { id: true },
    });

    if (hasCategory) {
      mode = "category";
    } else {
      const facility = await resolveFacilitySlug(categorySlug, locale);
      if (facility) {
        mode = "facility";
        facilityCategory = facility.category;
      }
    }
  } catch (error) {
    console.warn(
      "[CategoryPage] DB error for slug",
      categorySlug,
      error instanceof Error ? error.message : error,
    );
  }

  if (mode === "category") {
    return (
      <DiscoveryTemplate
        params={Promise.resolve({ categorySlug: resolveCategoryKey(categorySlug) || categorySlug })}
      />
    );
  }

  if (mode === "facility" && facilityCategory) {
    return (
      <FacilityShowcaseTemplate
        params={Promise.resolve({
          categorySlug: facilityCategory,
          facilitySlug: categorySlug,
        })}
      />
    );
  }

  notFound();
}
