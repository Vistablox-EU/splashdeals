import "server-only";
import { prisma } from "@/server/lib/prisma";
import { dbValueToSlug } from "@/lib/routing/categories";

/**
 * 🏙️ Active Cities
 * Returns regions with live inventory.
 */
export async function getActiveCities(): Promise<{ id: string; name: string; slug: string; _count: { facilities: number } }[]> {
  
  return prisma.city.findMany({
    where: {
      facilities: {
        some: {
          facility: { status: "ACTIVE" }
        } 
      }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { facilities: true }
      }
    },
    orderBy: {
      name: "asc"
    }
  });
}

/**
 * 🏷️ Categories
 * Aggregates categories from all facilities.
 */
export async function getDiscoveryCategories() {
  
  return prisma.facility.groupBy({
    by: ['category'],
    _count: { id: true }
  });
}

/**
 * 🕵️ Discovery Slug Validator
 * Ensures the URL discovery slug (category or city) matches the actual facility data.
 * Prevents duplicate content and enforces SEO canonical paths.
 */
export function validateDiscoverySlug(
  currentSlug: string,
  facility: { 
    category: string, 
    slug: string, 
    marketplaceCities?: { city: { slug: string } }[] 
  }): { isCategory: boolean; isCity: boolean; canonicalPath: string } {
  const canonicalCategory = dbValueToSlug(facility.category) ?? facility.category.toLowerCase().replace(/\s+/g, '-');
  const citySlugs = facility.marketplaceCities?.map((mc) => mc.city.slug) || [];
  
  const currentSlugLower = currentSlug.toLowerCase();
  const isValid = currentSlugLower === canonicalCategory || citySlugs.includes(currentSlugLower);

  if (!isValid) {
    throw new Error(`Invalid discovery slug: "${currentSlug}"`);
  }

  return {
    isCategory: currentSlugLower === canonicalCategory,
    isCity: citySlugs.includes(currentSlugLower),
    canonicalPath: `/${facility.slug}`
  };
}
