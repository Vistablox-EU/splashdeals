"use client";
import { Icon } from "@/components/ui/Icon";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface City {
  id: string;
  name: string;
  slug: string;
}

interface CitiesDropdownProps {
  label: string;
  allRegionsLabel: string;
}

/**
 * 🏙️ Cities Dropdown (Premium Multi-Column Mega-Menu)
 * Dynamically fetches, highlights high-traffic hubs, and displays regional aquatic hubs.
 * Optimized for SEO equity distribution and premium desktop UX.
 */
export function CitiesDropdown({ label, allRegionsLabel }: CitiesDropdownProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("/api/cities");
        const data = await response.json();
        if (Array.isArray(data)) {
          setCities(data);
        }
      } catch (error) {
        console.error("🏙️ Header Cities Fetch Failed:", error);
      }
    };
    fetchCities();
  }, []);

  const sortedCities = React.useMemo(() => {
    if (!cities || !Array.isArray(cities)) return [];
    const popularSlugs = ["belgrade", "beograd", "novi-sad", "jagodina", "vrnjacka-banja", "subotica"];
    const popular = cities.filter(c => popularSlugs.includes(c.slug.toLowerCase()));
    const others = cities.filter(c => !popularSlugs.includes(c.slug.toLowerCase()));
    return [...popular, ...others];
  }, [cities]);

  if (cities.length === 0) return null;

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button 
          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors flex items-center gap-2 outline-none group"
        >
          <Icon name="location_on" className="text-[12px] text-cyan-500/70 group-hover:text-cyan-400 transition-colors" />
          {label}
          <div
            className={`transition-transform duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            <Icon name="keyboard_arrow_down" className="text-[12px] opacity-50" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[520px] bg-navy-deep/95 backdrop-blur-2xl border-white/10 p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-[120]"
      >
        <div className="px-2 py-1.5 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
            {label}
          </span>
          <span className="text-[8px] font-black text-cyan-500/80 uppercase tracking-widest leading-none flex items-center gap-1">
            <Icon name="auto_awesome" className="text-[10px] animate-pulse" /> Popularne Regije
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-1">
          {sortedCities.map((city) => {
            const isPopular = ["belgrade", "beograd", "novi-sad", "jagodina", "vrnjacka-banja", "subotica"].includes(city.slug.toLowerCase());
            return (
              <DropdownMenuItem key={city.id} asChild>
                <Link 
                  href={`/facilities/${city.slug}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all group/item cursor-pointer",
                    isPopular 
                      ? "text-cyan-400 bg-cyan-500/[0.04] hover:text-white hover:bg-cyan-500/10 border border-cyan-500/10 hover:border-cyan-500/30" 
                      : "text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/5"
                  )}
                >
                  {/* Premium Hover Dot / Glow Indicator */}
                  <div className="relative flex items-center justify-center shrink-0 w-2 h-2">
                    {isPopular ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400 blur-[1px] opacity-40 group-hover/item:scale-[2] transition-all duration-500" />
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600/60 group-hover/item:bg-cyan-400 transition-all duration-300" />
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400 blur-[1px] opacity-0 group-hover/item:opacity-40 group-hover/item:scale-150 transition-all duration-500" />
                      </>
                    )}
                  </div>
                  <span className="truncate">{city.name}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="bg-white/5 my-2.5" />
        
        <DropdownMenuItem asChild>
          <Link 
            href={`/facilities`}
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-xs font-black italic uppercase tracking-widest text-cyan-400 hover:text-white hover:bg-cyan-500/20 border border-dashed border-cyan-500/20 hover:border-cyan-500/40 rounded-lg transition-all cursor-pointer text-center bg-cyan-500/[0.02]"
          >
            {allRegionsLabel}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
