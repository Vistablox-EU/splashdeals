"use client";
import { Icon } from "@/components/ui/Icon";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useState, useTransition } from "react";

interface FilterBarProps {
  cities: { id: string; name: string; slug: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: Record<string, any>;
}

/**
 * 🎛️ FilterBar Component
 * client-side filtering engine for facility discovery.
 * Manages URL search params for city, price range, and sorting.
 */
export function FilterBar({ cities, dict }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for immediate UI feedback on inputs
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  // Adjust state during render when URL changes (Prevents cascading effect renders)
  const [prevParams, setPrevParams] = useState(searchParams.toString());
  if (searchParams.toString() !== prevParams) {
    setPrevParams(searchParams.toString());
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
  }

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    params.delete("page"); // Reset pagination on filter change
    
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const handleClearFilters = () => {
    router.push(window.location.pathname, { scroll: false });
  };

  const hasFilters = searchParams.size > 0;

  return (
    <div
      className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md mb-8 relative"
      aria-busy={isPending}
    >
      <div className="flex items-center gap-2 mr-2">
        <Icon name="tune" className="text-[16px] text-cyan-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {dict.filters.filters_label || "Filteri"}
        </span>
      </div>

      {/* 🏙️ City Filter */}
      <div className="w-full sm:w-auto">
        <Label htmlFor="city-filter" className="sr-only">{dict.filters.all_cities}</Label>
        <Select 
          value={searchParams.get("city") || "all"} 
          onValueChange={(val) => updateParams({ city: val === "all" ? null : val })}
        >
          <SelectTrigger id="city-filter" className="w-full sm:w-[180px] bg-slate-900/50 border-white/10 text-white font-bold uppercase text-[10px] tracking-widest h-12 sm:h-10">
            <div className="flex items-center gap-2">
              <Icon name="location_on" className="text-[12px] text-cyan-400" />
              <SelectValue placeholder={dict.filters.all_cities} />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-white/10 text-white font-bold uppercase text-[10px] tracking-widest">
            <SelectItem value="all">{dict.filters.all_cities}</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.slug}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 💰 Price Range */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative group flex-1 sm:flex-none">
          <Label htmlFor="min-price" className="sr-only">{dict.filters.min_price}</Label>
          <Icon name="payments" className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          <Input 
            id="min-price"
            type="number"
            placeholder={dict.filters.min_price}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={() => updateParams({ minPrice })}
            className="w-full sm:w-28 pl-8 h-12 sm:h-10 bg-slate-900/50 border-white/10 text-white font-bold text-[10px] uppercase tracking-widest focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
          />
        </div>
        <span className="text-slate-700 font-bold">-</span>
        <div className="relative group flex-1 sm:flex-none">
          <Label htmlFor="max-price" className="sr-only">{dict.filters.max_price}</Label>
          <Icon name="payments" className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          <Input 
            id="max-price"
            type="number"
            placeholder={dict.filters.max_price}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={() => updateParams({ maxPrice })}
            className="w-full sm:w-28 pl-8 h-12 sm:h-10 bg-slate-900/50 border-white/10 text-white font-bold text-[10px] uppercase tracking-widest focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="hidden sm:block w-px h-6 bg-white/5" />

      {/* 🔃 Sort Select */}
      <div className="w-full sm:w-auto">
        <Label htmlFor="sort-filter" className="sr-only">{dict.filters.sort_by}</Label>
        <Select 
          value={searchParams.get("sort") || "newest"} 
          onValueChange={(val) => updateParams({ sort: val })}
        >
          <SelectTrigger id="sort-filter" className="w-full sm:w-[200px] bg-slate-900/50 border-white/10 text-white font-bold uppercase text-[10px] tracking-widest h-12 sm:h-10">
            <div className="flex items-center gap-2">
              <Icon name="swap_vert" className="text-[12px] text-cyan-400" />
              <SelectValue placeholder={dict.filters.sort_by} />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-slate-950 border-white/10 text-white font-bold uppercase text-[10px] tracking-widest">
            <SelectItem value="newest">{dict.filters.sort_newest || "Najnoviji"}</SelectItem>
            <SelectItem value="price_asc">{dict.filters.sort_price_asc}</SelectItem>
            <SelectItem value="price_desc">{dict.filters.sort_price_desc}</SelectItem>
            <SelectItem value="name_asc">{dict.filters.sort_name}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 🧹 Clear Button */}
      {hasFilters && (
        <div
          className="ml-auto w-full sm:w-auto"
        >
          <Button 
            variant="ghost" 
            onClick={handleClearFilters}
            className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors h-12 sm:h-10 gap-2"
          >
            <Icon name="close" className="text-[14px]" />
            {dict.filters.clear_filters}
          </Button>
        </div>
      )}

      {isPending && (
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] flex items-center justify-center rounded-2xl" aria-live="polite">
          <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
