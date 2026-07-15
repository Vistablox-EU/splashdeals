import { dbValueToSlug } from "@/lib/routing/categories";

export type DiscoverySlugFacility = {
  category: string;
  slug: string;
  marketplaceCities?: { city: { slug: string } }[];
};

export type DiscoverySlugValidation = {
  valid: boolean;
  isCategory: boolean;
  isCity: boolean;
  canonicalPath: string;
  canonicalCategory: string;
};

/**
 * Pure discovery-slug validation (never throws).
 * Invalid slugs return valid:false + canonical facility path for redirect/notFound.
 */
export function getDiscoverySlugValidation(
  currentSlug: string,
  facility: DiscoverySlugFacility,
): DiscoverySlugValidation {
  const canonicalCategory =
    dbValueToSlug(facility.category) ?? facility.category.toLowerCase().replace(/\s+/g, "-");
  const citySlugs = facility.marketplaceCities?.map((mc) => mc.city.slug) || [];
  const currentSlugLower = currentSlug.toLowerCase();
  const isCategory = currentSlugLower === canonicalCategory.toLowerCase();
  const isCity = citySlugs.includes(currentSlugLower);

  return {
    valid: isCategory || isCity,
    isCategory,
    isCity,
    canonicalPath: `/${facility.slug}`,
    canonicalCategory,
  };
}
