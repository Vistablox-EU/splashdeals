"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface City {
  id: string;
  name: string;
  slug: string;
}

import type { Dict } from "@/lib/types";

interface MobileCityPickerProps {
  cities: City[];
  dict: Dict;
  onCitySelect: () => void;
}

export function MobileCityPicker({ cities, dict, onCitySelect }: MobileCityPickerProps) {
  const sortedCities = React.useMemo(() => {
    if (!cities || !Array.isArray(cities)) return [];
    const popularSlugs = ["beograd", "novi-sad", "jagodina", "vrnjacka-banja", "subotica"];
    const popular = cities.filter((c) => popularSlugs.includes(c.slug.toLowerCase()));
    const others = cities.filter((c) => !popularSlugs.includes(c.slug.toLowerCase()));
    return [...popular, ...others];
  }, [cities]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
        <Icon name="location_on" className="text-[14px] text-muted-foreground" />
        {dict.nav.cities}
      </div>

      <div className="relative w-full">
        {/* Right gradient fade overlay */}
        <div className="from-background pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-12 bg-gradient-to-l to-transparent" />

        <div className="no-scrollbar flex w-full cursor-grab gap-2 overflow-x-auto scroll-smooth px-1 pb-2 select-none active:cursor-grabbing">
          {sortedCities.map((city) => {
            const popularSlugs = ["beograd", "novi-sad", "jagodina", "vrnjacka-banja", "subotica"];
            const isPopular = popularSlugs.includes(city.slug.toLowerCase());
            return (
              <Link
                key={city.id}
                href={`/search?q=${encodeURIComponent(city.name)}`}
                onClick={onCitySelect}
                className={cn(
                  "flex h-11 shrink-0 items-center justify-center rounded-full border px-4 text-[10px] font-black tracking-widest uppercase transition-all duration-300 active:scale-95",
                  isPopular
                    ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.05)]"
                    : "border-border/10 bg-muted/10 text-muted-foreground hover:border-border/20 hover:bg-muted/20 hover:text-foreground",
                )}
              >
                {isPopular && (
                  <Icon name="auto_awesome" className="text-primary mr-1.5 text-[12px]" />
                )}
                {city.name}
              </Link>
            );
          })}
          <Link
            href={`/`}
            onClick={onCitySelect}
            className="text-primary/80 hover:text-primary hover:border-primary/30 flex h-11 shrink-0 items-center justify-center rounded-full border border-dashed border-border/20 bg-white/5 px-5 text-[10px] font-black tracking-widest uppercase transition-all active:scale-95"
          >
            {dict.nav.all_regions || "Sve Regije"}
          </Link>
        </div>
      </div>
    </div>
  );
}
