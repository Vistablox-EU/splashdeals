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

interface MobileCityPickerProps {
  cities: City[];
  dict: any;
  onCitySelect: () => void;
}

export function MobileCityPicker({ cities, dict, onCitySelect }: MobileCityPickerProps) {
  const sortedCities = React.useMemo(() => {
    if (!cities || !Array.isArray(cities)) return [];
    const popularSlugs = ["beograd", "novi-sad", "jagodina", "vrnjacka-banja", "subotica"];
    const popular = cities.filter(c => popularSlugs.includes(c.slug.toLowerCase()));
    const others = cities.filter(c => !popularSlugs.includes(c.slug.toLowerCase()));
    return [...popular, ...others];
  }, [cities]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
        <Icon name="location_on" className="text-[14px] text-slate-600" />
        {dict.nav.cities}
      </div>

      <div className="relative w-full">
        {/* Right gradient fade overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 scroll-smooth select-none cursor-grab active:cursor-grabbing w-full px-1">
          {sortedCities.map((city) => {
            const popularSlugs = ["beograd", "novi-sad", "jagodina", "vrnjacka-banja", "subotica"];
            const isPopular = popularSlugs.includes(city.slug.toLowerCase());
            return (
              <Link
                key={city.id}
                href={`/search?q=${encodeURIComponent(city.name)}`}
                onClick={onCitySelect}
                className={cn(
                  "shrink-0 h-10 px-4 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 border",
                  isPopular
                    ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_12px_rgba(6,182,212,0.05)] hover:bg-primary/20 hover:border-primary/40"
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/10"
                )}
              >
                {isPopular && <Icon name="auto_awesome" className="text-[12px] mr-1.5 text-primary" />}
                {city.name}
              </Link>
            );
          })}
          <Link
            href={`/`}
            onClick={onCitySelect}
            className="shrink-0 h-10 px-5 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest bg-white/5 border border-dashed border-white/15 text-primary/80 hover:text-primary hover:border-primary/30 transition-all active:scale-95"
          >
            {dict.nav.all_regions || "Sve Regije"}
          </Link>
        </div>
      </div>
    </div>
  );
}
