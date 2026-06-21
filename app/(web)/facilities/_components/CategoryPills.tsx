"use client";
import { Icon } from "@/components/ui/Icon";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";

import { cn } from "@/lib/utils";

interface CategoryPillsProps {
  categories: {
    category: string;
    _count: {
      id: number;
    };
  }[];
  facilitiesLabel: string;
}

/**
 * 🧿 CategoryPills Component
 * Interactive toggle pills for category filtering.
 * Enhanced with Accessibility (ARIA) and React 19 Transitions.
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

export function CategoryPills({ categories, facilitiesLabel }: CategoryPillsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const activeCategory = searchParams.get("category");

  const toggleCategory = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalizedCategory = category.toLowerCase();
    
    if (activeCategory?.toLowerCase() === normalizedCategory) {
      params.delete("category");
    } else {
      params.set("category", normalizedCategory);
    }
    
    params.delete("page");
    
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div 
      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" 
      aria-busy={isPending}
      aria-label="Filtriraj po kategoriji"
    >
      {categories.map((cat, i) => {
        const isActive = activeCategory?.toLowerCase() === cat.category.toLowerCase();
        
        return (
          <div
            key={cat.category}
          >
            <button 
              onClick={() => toggleCategory(cat.category)}
              aria-pressed={isActive}
              disabled={isPending}
              className={cn(
                "w-full text-left rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
                isPending && "opacity-80 cursor-wait"
              )}
            >
              <Card 
                className={cn(
                  "p-6 text-center transition-all duration-300 border-border group relative overflow-hidden h-full",
                  isActive 
                    ? "bg-primary/20 border-primary/40 ring-1 ring-primary/20" 
                    : "hover:bg-primary/10"
                )}
              >
                <div className={cn(
                  "absolute top-0 right-0 p-2 transition-opacity duration-300",
                  isActive ? "opacity-20" : "opacity-5"
                )}>
                   <Icon name="filter_list" className={cn("text-[48px]", isActive ? "text-primary" : "text-foreground")} />
                </div>
                <span className={cn(
                  "block text-[10px] font-black uppercase tracking-[0.2em] mb-2 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {cat._count.id} {facilitiesLabel}
                </span>
                <span className={cn(
                  "text-lg font-black uppercase italic tracking-tighter transition-colors",
                  isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                )}>
                  {getCategoryLabel(cat.category)}
                </span>
                
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                  />
                )}
              </Card>
            </button>
          </div>
        );
      })}
    </div>
  );
}
