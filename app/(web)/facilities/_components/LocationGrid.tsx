import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/server/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/card";

interface LocationGridProps {
  
  facilitiesLabel: string;
}

/**
 * 🏙️ LocationGrid Interface
 * Institutional discovery hub for regional tagging distribution.
 */
export async function LocationGrid({ facilitiesLabel }: LocationGridProps) {
  const cities = await prisma.city.findMany({
    include: {
      _count: {
        select: {
          facilities: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Filter out cities with 0 facilities to keep the UI dense and relevant
  const activeCities = cities.filter(city => city._count.facilities > 0);

  if (activeCities.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {activeCities.map((city) => (
        <div
          key={city.id}
          className="transition-all duration-300"
        >
          <Link href={`/search?q=${encodeURIComponent(city.name)}`} aria-label={`${city.name} - ${city._count.facilities} ${facilitiesLabel}`}>
            <Card className="p-6 text-center hover:bg-primary/10 transition-colors border-border group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                 <Icon name="location_on" className="text-[48px]" />
              </div>
              <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">
                {city._count.facilities} {facilitiesLabel}
              </span>
              <span className="text-lg font-black uppercase italic tracking-tighter text-foreground group-hover:text-primary transition-colors">
                {city.name}
              </span>
            </Card>
          </Link>
        </div>
      ))}
    </div>
  );
}
