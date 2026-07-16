import { prisma } from "@/app/(server)/lib/prisma";
import { FacilityCard } from "./FacilityCard";
import { getFavoritedFacilityIds } from "@/app/(server)/actions/favorites";

interface FacilityGridProps {
  dict: Record<string, any>;
  fromLabel: string;
  category?: string;
  citySlug?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  noFacilitiesLabel?: string;
}

/**
 * 🚀 FacilityGrid Interface (Hardened Edition)
 * Asynchronous data provider for marketplace discovery with dynamic filtering.
 * Applies multi-dimensional filters and sorting directly in the discovery engine.
 */
interface FacilityWithMinPrice {
  minPrice?: number | null;
  [key: string]: unknown;
}

export async function FacilityGrid({
  dict,
  fromLabel,
  category,
  citySlug,
  minPrice,
  maxPrice,
  sort = "newest",
  noFacilitiesLabel,
}: FacilityGridProps) {
  // 1. Build Query — soft-fail when Neon control plane is flaky (Vercel build)
  let facilities: Awaited<ReturnType<typeof prisma.facility.findMany>> = [];
  try {
    facilities = await prisma.facility.findMany({
      where: {
        ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
        ...(citySlug
          ? {
              marketplaceCities: {
                some: {
                  city: {
                    slug: citySlug,
                  },
                },
              },
            }
          : {}),
        ...(minPrice || maxPrice
          ? {
              ticketCategories: {
                some: {
                  isActive: true,
                  types: {
                    some: {
                      isActive: true,
                      prices: {
                        some: {
                          ...(minPrice ? { price: { gte: parseFloat(minPrice) } } : {}),
                          ...(maxPrice ? { price: { lte: parseFloat(maxPrice) } } : {}),
                        },
                      },
                    },
                  },
                },
              },
            }
          : {}),
      },
      include: {
        media: {
          orderBy: { order: "asc" },
        },
        ticketCategories: {
          where: { isActive: true },
          include: {
            types: {
              where: { isActive: true },
              include: {
                prices: {
                  orderBy: { price: "asc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: sort === "name_asc" ? { name: "asc" } : { createdAt: "desc" },
    });
  } catch (error) {
    console.warn("[FacilityGrid] DB unavailable:", error instanceof Error ? error.message : error);
    facilities = [];
  }

  // 2. Client-side Sort Logic (for complex fields like price)
  const processedFacilities = [...facilities];

  if (sort === "price_asc" || sort === "price_desc") {
    processedFacilities.sort((a, b) => {
      const priceA = (a as FacilityWithMinPrice).minPrice ?? Infinity;
      const priceB = (b as FacilityWithMinPrice).minPrice ?? Infinity;

      return sort === "price_asc" ? priceA - priceB : priceB - priceA;
    });
  }

  if (processedFacilities.length === 0 && noFacilitiesLabel) {
    return (
      <div className="bg-muted/50 border-border rounded-[2.5rem] border py-24 text-center backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-muted border-border flex h-16 w-16 items-center justify-center rounded-full border">
            <span className="text-2xl">🌊</span>
          </div>
          <span className="text-muted-foreground text-xs font-black tracking-[0.3em] uppercase">
            {noFacilitiesLabel}
          </span>
          <span className="text-muted-foreground max-w-xs text-[10px] leading-relaxed font-bold tracking-widest uppercase">
            {dict?.facilities?.no_results_hint ||
              "Pokušajte da prilagodite filtere ili istražite druge kategorije."}
          </span>
        </div>
      </div>
    );
  }

  // 3. Serialize Prisma Decimal → number for client component props
  const serializedFacilities = processedFacilities.map((f) => {
    // Extract lowest price from nested ticketCategories → types → prices
    let lowestPrice: number | null = null;
    for (const cat of (
      f as { ticketCategories?: { types?: { prices?: { price: unknown }[] }[] }[] }
    ).ticketCategories || []) {
      for (const type of cat.types || []) {
        for (const price of type.prices || []) {
          const val = Number(price.price);
          if (lowestPrice === null || val < lowestPrice) lowestPrice = val;
        }
      }
    }
    return {
      ...f,
      ticketCategories: [],
      minPrice: lowestPrice,
    };
  });

  const favoritedIds = await getFavoritedFacilityIds(serializedFacilities.map((f) => f.id));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {serializedFacilities.map((facility, idx) => (
        <div key={facility.id} className="transition-[opacity,transform] duration-500">
          <FacilityCard
            facility={facility}
            dict={dict}
            fromLabel={fromLabel}
            isPriority={idx < 10}
            isFavorited={favoritedIds.has(facility.id)}
          />
        </div>
      ))}
    </div>
  );
}
