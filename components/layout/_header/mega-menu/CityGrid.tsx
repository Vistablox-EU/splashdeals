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

interface CityGridProps {
  cities: City[];
  loading: boolean;
  onCityClick: () => void;
  dict: any;
}

const POPULAR_SLUGS = [
  "belgrade",
  "beograd",
  "novi-sad",
  "jagodina",
  "vrnjacka-banja",
  "subotica",
];

export function CityGrid({ cities, loading, onCityClick, dict }: CityGridProps) {
  const sortedCities = React.useMemo(() => {
    if (!cities || !Array.isArray(cities)) return [];
    const popular = cities.filter((c) =>
      POPULAR_SLUGS.includes(c.slug.toLowerCase())
    );
    const others = cities.filter(
      (c) => !POPULAR_SLUGS.includes(c.slug.toLowerCase())
    );
    return [...popular, ...others];
  }, [cities]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <span className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">
          {dict?.nav?.cities || "Gradovi i Regije"}
        </span>
        <span className="text-xs font-black text-cyan-500/80 uppercase tracking-widest leading-none flex items-center gap-1.5">
          <Icon name="auto_awesome" className="text-[14px] animate-pulse" />{" "}
          Popularno
        </span>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Cities grid */}
          <div className="grid grid-cols-3 gap-2">
            {sortedCities.slice(0, 12).map((city) => {
              const isPopular = POPULAR_SLUGS.includes(
                city.slug.toLowerCase()
              );
              return (
                <Link
                  key={city.id}
                  href={`/search?q=${encodeURIComponent(city.name)}`}
                  onClick={onCityClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 text-[13px] font-bold rounded-xl transition-all group/item cursor-pointer",
                    isPopular
                      ? "text-cyan-400 bg-cyan-500/[0.04] hover:text-white hover:bg-cyan-500/10 border border-cyan-500/10 hover:border-cyan-500/30"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/5"
                  )}
                >
                  <div className="relative flex items-center justify-center shrink-0 w-2.5 h-2.5">
                    {isPopular ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <div className="absolute inset-0 rounded-full bg-cyan-400 blur-[2px] opacity-40 group-hover/item:scale-[2] transition-all duration-500" />
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-slate-600/60 group-hover/item:bg-cyan-400 transition-all duration-300" />
                        <div className="absolute inset-0 rounded-full bg-cyan-400 blur-[2px] opacity-0 group-hover/item:opacity-40 group-hover/item:scale-150 transition-all duration-500" />
                      </>
                    )}
                  </div>
                  <span className="truncate">{city.name}</span>
                </Link>
              );
            })}
            {sortedCities.length > 12 && (
              <Link
                href="/facilities"
                onClick={onCityClick}
                className="flex items-center justify-center gap-2 px-4 py-3.5 text-[13px] font-bold rounded-xl border border-dashed border-white/10 text-cyan-500/70 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer"
              >
                <span>+{sortedCities.length - 12} gradova</span>
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
