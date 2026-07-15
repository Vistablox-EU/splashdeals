"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TableSkeleton({
  rows = 10,
  density = "compact",
}: {
  rows?: number;
  density?: "comfortable" | "compact";
}) {
  return (
    <div className="space-y-4">
      {/* Match FacilitiesTableToolbar chrome */}
      <div className="bg-background/40 border-border/50 flex flex-col items-stretch justify-between gap-3 rounded-xl border p-2 backdrop-blur-md lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Skeleton className="bg-muted/30 h-9 w-full sm:max-w-xs" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="bg-muted/30 h-9 w-[160px]" />
            <Skeleton className="bg-muted/30 h-9 w-[100px]" />
            <Skeleton className="bg-muted/30 h-9 w-20" />
            <Skeleton className="bg-muted/30 h-9 w-9 rounded-lg" />
            <Skeleton className="bg-muted/30 h-9 w-20" />
          </div>
        </div>
      </div>

      <div className="border-border/50 bg-muted/40 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-md">
        <div className="border-border/50 bg-muted/50 border-b">
          <div
            className={cn("flex items-center gap-4 px-3", density === "compact" ? "h-8" : "h-10")}
          >
            <Skeleton className="bg-muted/50 h-3 w-4" />
            <Skeleton className="bg-muted/50 h-3 w-3/12" />
            <Skeleton className="bg-muted/50 h-3 w-2/12" />
            <Skeleton className="bg-muted/50 h-3 w-2/12" />
            <Skeleton className="bg-muted/50 h-3 w-1/12" />
            <Skeleton className="bg-muted/50 h-3 w-1/12" />
          </div>
        </div>
        <div className="divide-border/50 divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className={cn("flex items-center gap-4 px-3", density === "compact" ? "h-9" : "h-12")}
            >
              <Skeleton className="bg-muted/30 h-4 w-4" />
              <Skeleton className="bg-muted/30 h-4 w-3/12" />
              <Skeleton className="bg-muted/30 h-4 w-2/12" />
              <Skeleton className="bg-muted/30 h-4 w-2/12" />
              <Skeleton className="bg-muted/30 ml-auto h-4 w-1/12" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="bg-muted/30 h-3 w-32" />
        <div className="flex gap-2">
          <Skeleton className="bg-muted/30 h-8 w-8" />
          <Skeleton className="bg-muted/30 h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
