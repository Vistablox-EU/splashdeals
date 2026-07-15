import "server-only";
import { prisma } from "@/app/(server)/lib/prisma";
import {
  getDiscoverySlugValidation,
  type DiscoverySlugFacility,
  type DiscoverySlugValidation,
} from "@/lib/routing/discovery-slug";

export type { DiscoverySlugFacility, DiscoverySlugValidation };
export { getDiscoverySlugValidation };

/**
 * 🏙️ Active Cities
 * Returns regions with live inventory.
 */
export async function getActiveCities(): Promise<
  { id: string; name: string; slug: string; _count: { facilities: number } }[]
> {
  return prisma.city.findMany({
    where: {
      facilities: {
        some: {
          facility: { status: "ACTIVE" },
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { facilities: true },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * 🏷️ Categories
 * Aggregates categories from all facilities.
 */
export async function getDiscoveryCategories() {
  return prisma.facility.groupBy({
    by: ["category"],
    _count: { id: true },
  });
}

/**
 * 🕵️ Discovery Slug Validator
 * Ensures the URL discovery slug (category or city) matches the actual facility data.
 * Never throws — callers must redirect/notFound when valid is false.
 */
export function validateDiscoverySlug(
  currentSlug: string,
  facility: DiscoverySlugFacility,
): DiscoverySlugValidation {
  return getDiscoverySlugValidation(currentSlug, facility);
}
