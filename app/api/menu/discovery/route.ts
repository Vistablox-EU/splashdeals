import { NextResponse } from "next/server"
import { prisma } from "@/server/lib/prisma"

/**
 * Discovery Menu API
 * Aggregates regional hubs and featured showcase facility for the desktop mega menu.
 */
export async function GET() {
  try {
    // 1. Fetch active cities
    const cities = await prisma.city.findMany({
      where: {
        facilities: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    // 2. Fetch featured showcase facility
    const featuredFacility = await prisma.facility.findFirst({
      where: {
        status: "ACTIVE",
        media: {
          some: {
            isHero: true,
          },
        },
        ticketCategories: {
          some: {
            isActive: true,
            types: {
              some: {
                isActive: true,
                prices: {
                  some: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
      include: {
        media: {
          where: { isHero: true },
          take: 1,
        },
        ticketCategories: {
          where: { isActive: true },
          include: {
            types: {
              where: { isActive: true },
              include: {
                prices: {
                  where: { isActive: true },
                  orderBy: { price: "asc" },
                  take: 1,
                },
              },
              take: 1,
            },
          },
          take: 1,
        },
        marketplaceCities: {
          include: {
            city: true,
          },
        },
      },
    })

    // 3. Format featured facility into a clean DTO
    let featured = null
    if (featuredFacility) {
      const canonicalCategory = featuredFacility.category.toLowerCase().replace(/\s+/g, "-")
      const cheapestPrice = featuredFacility.ticketCategories?.[0]?.types?.[0]?.prices?.[0]
      const citySlug = featuredFacility.marketplaceCities?.[0]?.city?.slug || canonicalCategory

      featured = {
        id: featuredFacility.id,
        name: featuredFacility.name,
        slug: featuredFacility.slug,
        category: featuredFacility.category,
        city: featuredFacility.city,
        canonicalPath: `/facilities/${citySlug}/${featuredFacility.slug}`,
        imageUrl: featuredFacility.media[0]?.url || "/og-image.png",
        startingPrice: cheapestPrice ? Number(cheapestPrice.price) : null,
        description:
          featuredFacility.description?.slice(0, 100) ||
          "Doživite nezaboravnu letnju avanturu na najboljim bazenima u Srbiji.",
      }
    }

    return NextResponse.json({ cities, featured })
  } catch (error) {
    console.error("Discovery Menu Error:", error)
    return NextResponse.json({ error: "Failed to fetch discovery menu data" }, { status: 500 })
  }
}
