"use client";
import { Icon } from "@/components/ui/Icon";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useTransition } from "react";

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
      className="bg-muted/50 border-border relative mb-6 flex flex-wrap items-center gap-3 rounded-2xl border p-3 backdrop-blur-md sm:mb-8 sm:gap-4 sm:p-4"
      aria-busy={isPending}
    >
      <div className="mr-1 flex items-center gap-2 sm:mr-2">
        <Icon name="tune" className="text-primary text-[16px]" />
        <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
          {dict.filters.filters_label || "Filteri"}
        </span>
      </div>

      {/* 🏙️ City Filter */}
      <div className="w-full sm:w-auto">
        <Label htmlFor="city-filter" className="sr-only">
          {dict.filters.all_cities}
        </Label>
        <Select
          value={searchParams.get("city") || "all"}
          onValueChange={(val) => updateParams({ city: val === "all" ? null : val })}
        >
          <SelectTrigger
            id="city-filter"
            className="bg-muted/50 border-border text-foreground h-12 w-full text-[10px] font-bold tracking-widest uppercase sm:h-10 sm:w-[180px]"
          >
            <div className="flex items-center gap-2">
              <Icon name="location_on" className="text-primary text-[12px]" />
              <SelectValue placeholder={dict.filters.all_cities} />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border text-foreground text-[10px] font-bold tracking-widest uppercase">
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
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <div className="group relative flex-1 sm:flex-none">
          <Label htmlFor="min-price" className="sr-only">
            {dict.filters.min_price}
          </Label>
          <Icon
            name="payments"
            className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 -translate-y-1/2 text-[12px] transition-colors"
          />
          <Input
            id="min-price"
            type="number"
            placeholder={dict.filters.min_price}
            defaultValue={searchParams.get("minPrice") || ""}
            key={`min-${searchParams.get("minPrice") || ""}`}
            onBlur={(e) => updateParams({ minPrice: e.target.value })}
            className="bg-muted/50 border-border text-foreground focus:border-ring placeholder:text-muted-foreground/60 h-12 pl-8 text-[10px] font-bold tracking-widest uppercase transition-colors sm:h-10 sm:w-28"
          />
        </div>
        <span className="text-foreground font-bold">-</span>
        <div className="group relative flex-1 sm:flex-none">
          <Label htmlFor="max-price" className="sr-only">
            {dict.filters.max_price}
          </Label>
          <Icon
            name="payments"
            className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-3 -translate-y-1/2 text-[12px] transition-colors"
          />
          <Input
            id="max-price"
            type="number"
            placeholder={dict.filters.max_price}
            defaultValue={searchParams.get("maxPrice") || ""}
            key={`max-${searchParams.get("maxPrice") || ""}`}
            onBlur={(e) => updateParams({ maxPrice: e.target.value })}
            className="bg-muted/50 border-border text-foreground focus:border-ring placeholder:text-muted-foreground/60 h-12 pl-8 text-[10px] font-bold tracking-widest uppercase transition-colors sm:h-10 sm:w-28"
          />
        </div>
      </div>

      <div className="bg-muted/50 hidden h-6 w-px sm:block" />

      {/* 🔃 Sort Select */}
      <div className="w-full sm:w-auto">
        <Label htmlFor="sort-filter" className="sr-only">
          {dict.filters.sort_by}
        </Label>
        <Select
          value={searchParams.get("sort") || "newest"}
          onValueChange={(val) => updateParams({ sort: val })}
        >
          <SelectTrigger
            id="sort-filter"
            className="bg-muted/50 border-border text-foreground h-12 w-full text-[10px] font-bold tracking-widest uppercase sm:h-10 sm:w-[200px]"
          >
            <div className="flex items-center gap-2">
              <Icon name="swap_vert" className="text-primary text-[12px]" />
              <SelectValue placeholder={dict.filters.sort_by} />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border text-foreground text-[10px] font-bold tracking-widest uppercase">
            <SelectItem value="newest">{dict.filters.sort_newest || "Najnoviji"}</SelectItem>
            <SelectItem value="price_asc">{dict.filters.sort_price_asc}</SelectItem>
            <SelectItem value="price_desc">{dict.filters.sort_price_desc}</SelectItem>
            <SelectItem value="name_asc">{dict.filters.sort_name}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 🧹 Clear Button */}
      {hasFilters && (
        <div className="ml-auto w-full sm:w-auto">
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground h-12 w-full gap-2 text-[10px] font-black tracking-widest uppercase transition-colors sm:h-10 sm:w-auto"
          >
            <Icon name="close" className="text-[14px]" />
            {dict.filters.clear_filters}
          </Button>
        </div>
      )}

      {isPending && (
        <div
          className="bg-background/20 absolute inset-0 flex items-center justify-center rounded-2xl backdrop-blur-[1px]"
          aria-live="polite"
        >
          <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
