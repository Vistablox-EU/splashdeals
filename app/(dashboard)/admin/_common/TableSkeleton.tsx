"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function TableSkeleton({ rows = 10, density = "compact" }: { rows?: number, density?: "comfortable" | "compact" }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-2 bg-muted/30 border border-border/50 rounded-xl">
        <div className="flex flex-1 items-center gap-3">
          <Skeleton className="h-9 w-64 bg-muted/30" />
          <Skeleton className="h-9 w-40 bg-muted/30" />
        </div>
        <Skeleton className="h-9 w-9 bg-muted/30" />
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="border-b border-border/50 bg-muted/50">
           <div className={cn("flex items-center px-3", density === "compact" ? "h-8" : "h-10")}>
              <Skeleton className="h-3 w-4/12 bg-muted/50" />
              <Skeleton className="h-3 w-2/12 bg-muted/50 ml-4" />
              <Skeleton className="h-3 w-2/12 bg-muted/50 ml-4" />
              <Skeleton className="h-3 w-2/12 bg-muted/50 ml-4" />
           </div>
        </div>
        <div className="divide-y divide-white/5">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className={cn("flex items-center px-3", density === "compact" ? "h-9" : "h-12")}>
              <Skeleton className="h-4 w-4/12 bg-muted/30" />
              <Skeleton className="h-4 w-2/12 bg-muted/30 ml-4" />
              <Skeleton className="h-4 w-2/12 bg-muted/30 ml-4" />
              <Skeleton className="h-4 w-1/12 bg-muted/30 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
