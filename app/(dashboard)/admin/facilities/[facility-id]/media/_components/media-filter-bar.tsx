"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type MediaFilterId =
  "ALL" | "PHOTOS" | "VIDEOS" | "HERO" | "CARDBG" | "PUBLIC" | "HIDDEN" | "MISSING_ALT";

const FILTERS: { id: MediaFilterId; label: string }[] = [
  { id: "ALL", label: "Svi" },
  { id: "PHOTOS", label: "Slike" },
  { id: "VIDEOS", label: "Video" },
  { id: "HERO", label: "Hero" },
  { id: "CARDBG", label: "Kartica BG" },
  { id: "PUBLIC", label: "Javno" },
  { id: "HIDDEN", label: "Skriveno" },
  { id: "MISSING_ALT", label: "Bez ALT taga" },
];

interface MediaFilterBarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  activeFilter: MediaFilterId;
  onFilterChange: (v: MediaFilterId) => void;
}

export function MediaFilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
}: MediaFilterBarProps) {
  return (
    <div className="bg-muted/30 border-border/50 animate-in fade-in flex flex-col justify-between gap-4 rounded-2xl border p-4 duration-300 lg:flex-row lg:items-center">
      <div className="relative max-w-md flex-1">
        <Icon
          name="search"
          className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
        />
        <Input
          type="text"
          placeholder="Pretraži medije po ALT oznaci ili nazivu..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-border/50 text-foreground/90 placeholder:text-muted-foreground/80 focus:border-ring bg-muted/40 w-full rounded-xl border py-2 pr-4 pl-10 text-xs font-medium transition-colors focus:outline-none"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSearchChange("")}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 size-7 -translate-y-1/2 rounded-full transition-colors"
            aria-label="Obriši pretragu"
          >
            <Icon name="close" className="size-3.5" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((filt) => (
          <Button
            key={filt.id}
            variant={activeFilter === filt.id ? "default" : "outline"}
            size="sm"
            type="button"
            onClick={() => onFilterChange(filt.id)}
            className={cn(
              "h-7 rounded-lg px-3 text-[9px] font-black tracking-widest uppercase transition-colors",
              activeFilter === filt.id
                ? "border-primary bg-primary/20 text-primary border shadow-[0_0_15px_hsl(var(--primary)/0.15)]"
                : "bg-muted/10 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30 border",
            )}
          >
            {filt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
