import { cache } from "react";
import { prisma } from "@/app/(server)/lib/prisma";

/** Shared facility admin loader — dedupes layout + page fetches in one request. */
export const getFacilityAdminShell = cache(async (facilityId: string) => {
  return prisma.facility.findUnique({
    where: { id: facilityId },
    select: {
      id: true,
      name: true,
      status: true,
      slug: true,
      category: true,
      updatedAt: true,
      createdAt: true,
      socialLinks: true,
      publicPhone: true,
      publicEmail: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
      hours: true,
      streetName: true,
      streetNumber: true,
      city: true,
      lat: true,
      lng: true,
      _count: {
        select: {
          ticketCategories: true,
          media: true,
          amenities: true,
          faqs: true,
        },
      },
    },
  });
});
