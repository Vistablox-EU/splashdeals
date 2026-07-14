import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/(server)/lib/prisma";
import { serialize } from "@/lib/serialize";

// ── Types ────────────────────────────────────────────────────────

type FacilityWithIncludes = Prisma.FacilityGetPayload<{
  include: {
    media: { orderBy: { order: "asc" } };
    ticketCategories: {
      where: { isActive: true };
      include: {
        types: {
          where: { isActive: true };
          include: {
            prices: {
              where: { isActive: true };
              orderBy: { displayOrder: "asc" };
            };
          };
          orderBy: { displayOrder: "asc" };
        };
      };
      orderBy: { displayOrder: "asc" };
    };
    policy: true;
    hours: { orderBy: { dayOfWeek: "asc" } };
    amenities: { include: { amenity: true }; orderBy: { displayOrder: "asc" } };
    marketplaceCities: { include: { city: true } };
    faqs: { orderBy: { displayOrder: "asc" } };
  };
}>;

export type { FacilityWithIncludes };

// ── Fetch a single facility by slug ──────────────────────────────

export const getFacilityBySlug = cache(
  async (slug: string): Promise<FacilityWithIncludes | null> => {
    const result = await prisma.facility.findUnique({
      where: { slug },
      include: {
        media: { orderBy: { order: "asc" } },
        ticketCategories: {
          where: { isActive: true },
          include: {
            types: {
              where: { isActive: true },
              include: {
                prices: {
                  where: { isActive: true },
                  orderBy: { displayOrder: "asc" },
                },
              },
              orderBy: { displayOrder: "asc" },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
        policy: true,
        hours: { orderBy: { dayOfWeek: "asc" } },
        amenities: { include: { amenity: true }, orderBy: { displayOrder: "asc" } },
        marketplaceCities: { include: { city: true } },
        faqs: { orderBy: { displayOrder: "asc" } },
      },
    });

    if (result) return serialize(result);
    return null;
  },
);

// ── Fetch distinct facility categories ───────────────────────────

export async function getFacilityCategories(): Promise<string[]> {
  const results = await prisma.facility.findMany({
    where: { status: "ACTIVE" },
    select: { category: true },
    distinct: ["category"],
  });
  return results.map((r) => r.category).filter(Boolean) as string[];
}
