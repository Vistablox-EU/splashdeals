import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/server/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/card";

interface CategoryGridProps {
  
  facilitiesLabel: string;
}

/**
 * 🧿 CategoryGrid Interface
 * Asynchronous segment for category distribution discovery.
 */
const getCategoryLabel = (category: string) => {
  const c = category.toLowerCase().replace(/[\s_-]+/g, '_');
  const mapping: Record<string, string> = {
    waterpark: "Akva Park",
    pool: "Bazen",
    spa: "Spa Centar",
    swimming_pool: "Bazen",
    beach: "Plaža",
    attractions: "Atrakcije",
    services: "Usluge"
  };
  return mapping[c] || category;
};

export async function CategoryGrid({ facilitiesLabel }: CategoryGridProps) {
  const categories = await prisma.facility.groupBy({
    by: ['category'],
    _count: {
       id: true
    }
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {categories.map((cat, i) => (
        <div
          key={cat.category}
          className="transition-all duration-300"
        >
          <Link href={`/facilities/${cat.category.toLowerCase()}`} aria-label={`${getCategoryLabel(cat.category)} - ${cat._count.id} ${facilitiesLabel}`}>
            <Card className="p-6 text-center hover:bg-primary/10 transition-colors border-border group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                 <Icon name="filter_list" className="text-[48px]" />
              </div>
              <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">
                {cat._count.id} {facilitiesLabel}
              </span>
              <span className="text-lg font-black uppercase italic tracking-tighter text-foreground group-hover:text-primary transition-colors">
                {getCategoryLabel(cat.category)}
              </span>
            </Card>
          </Link>
        </div>
      ))}
    </div>
  );
}
