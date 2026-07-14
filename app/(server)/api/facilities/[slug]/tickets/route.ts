import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";

/**
 * GET /api/facilities/:slug/tickets
 * Returns the full ticket hierarchy (categories → products → prices) for a facility.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const facility = await prisma.facility.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!facility) {
    return NextResponse.json({ error: "Facility not found" }, { status: 404 });
  }

  const categories = await prisma.ticketCategory.findMany({
    where: { facilityId: facility.id, isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      types: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        include: {
          prices: {
            where: { isActive: true },
            orderBy: { displayOrder: "asc" },
          },
        },
      },
    },
  });

  const result = categories.map((cat) => ({
    id: cat.id,
    title: cat.title,
    slug: cat.slug,
    products: cat.types.map((prod) => ({
      id: prod.id,
      title: prod.title,
      label: prod.label,
      requiresIdentity: prod.requiresIdentity,
      requiresPhoto: prod.requiresPhoto,
      minPeople: prod.minPeople,
      maxPeople: prod.maxPeople,
      isSeasonPass: prod.isSeasonPass,
      validityType: prod.validityType,
      imageUrl: prod.imageUrl,
      prices: prod.prices.map((p) => ({
        id: p.id,
        label: p.label,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        dayType: p.dayType,
        timeSlot: p.timeSlot,
        validFrom: p.validFrom,
        validTo: p.validTo,
      })),
    })),
  }));

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
    },
  });
}
