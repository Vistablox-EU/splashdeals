import { prisma } from "@/server/lib/prisma";
import { FacilityCard } from "./FacilityCard";

interface FacilityGridProps {
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export async function FacilityGrid({ dict,
  fromLabel, 
  category,
  citySlug,
  minPrice,
  maxPrice,
  sort = "newest",
  noFacilitiesLabel 
}: FacilityGridProps) {
  
  // 1. Build Query
  const facilities = await prisma.facility.findMany({
    where: {
      ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
      ...(citySlug ? {
        marketplaceCities: {
          some: {
            city: {
              slug: citySlug
            }
          }
        }
      } : {}),
      ...(minPrice || maxPrice ? {
        tickets: {
          some: {
            isActive: true,
            ...(minPrice ? { price: { gte: parseFloat(minPrice) } } : {}),
            ...(maxPrice ? { price: { lte: parseFloat(maxPrice) } } : {}),
          }
        }
      } : {})
    },
    include: {
      media: {
        orderBy: { order: "asc" }
      },
      tickets: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
      }
    },
    orderBy: sort === 'name_asc' ? { name: 'asc' } : { createdAt: 'desc' }
  });

  // 2. Client-side Sort Logic (for complex fields like price)
  const processedFacilities = [...facilities];
  
  if (sort === 'price_asc' || sort === 'price_desc') {
    processedFacilities.sort((a, b) => {
      const priceA = a.tickets[0] ? Number(a.tickets[0].price) : Infinity;
      const priceB = b.tickets[0] ? Number(b.tickets[0].price) : Infinity;
      
      return sort === 'price_asc' ? priceA - priceB : priceB - priceA;
    });
  }

  if (processedFacilities.length === 0 && noFacilitiesLabel) {
    return (
      <div className="text-center py-24 bg-muted/50 rounded-[2.5rem] border border-border backdrop-blur-sm">
        <div
           className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-border">
             <span className="text-2xl">🌊</span>
          </div>
          <span className="text-muted-foreground font-black uppercase tracking-[0.3em] text-xs">
            {noFacilitiesLabel}
          </span>
          <span className="text-slate-600 text-[10px] uppercase font-bold tracking-widest max-w-xs leading-relaxed">
            {dict?.facilities?.no_results_hint || "Pokušajte da prilagodite filtere ili istražite druge kategorije."}
          </span>
        </div>
      </div>
    );
  }

  // 3. Serialize Prisma Decimal → number for client component props
  const serializedFacilities = processedFacilities.map((f) => ({
    ...f,
    tickets: f.tickets.map((t) => ({
      ...t,
      price: Number(t.price),
    })),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {serializedFacilities.map((facility, idx) => (
        <div
          key={facility.id}
          className="transition-all duration-500"
        >
          <FacilityCard 
            facility={facility} 
            dict={dict}
            fromLabel={fromLabel}
            isPriority={idx < 10}
          />
        </div>
      ))}
    </div>
  );
}
