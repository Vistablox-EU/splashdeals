"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function AmenitiesSkeleton() {
  return (
    <Card className="rounded-2xl border border-border/50 bg-muted/40 backdrop-blur-xl p-6 space-y-6 shadow-2xl relative overflow-hidden animate-pulse">
      {/* Search and filter bar skeletons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full max-w-md h-9 bg-background/40 rounded-lg border border-border/50 flex items-center px-3 gap-2">
          <div className="size-4 rounded bg-muted" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-6 w-10 bg-muted rounded-full" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="border border-border/50 rounded-xl overflow-hidden bg-background/20">
        <div className="divide-y divide-border/50">
          {/* Header row skeleton */}
          <div className="grid grid-cols-6 gap-4 p-4 bg-background/60 border-b border-border/50">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-3 w-28 bg-muted rounded" />
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-3 w-12 bg-muted rounded mx-auto" />
            <div className="h-3 w-8 bg-muted rounded ml-auto" />
          </div>

          {/* Data row skeletons */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-6 gap-4 p-4 items-center">
              <div className="h-6 w-10 bg-muted rounded-full" />
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-5 w-16 bg-muted rounded-full" />
              <div className="h-8 w-36 bg-muted rounded-lg" />
              <div className="h-5 w-5 bg-muted rounded mx-auto" />
              <div className="h-6 w-6 bg-muted rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Add Infrastructure footer skeleton */}
      <div className="pt-4 border-t border-border/50 space-y-3">
        <div className="h-3 w-48 bg-muted rounded" />
        <div className="flex flex-col md:flex-row items-center gap-3 bg-background/40 p-4 border border-border/50 rounded-xl">
          <div className="flex-1 h-9 bg-muted rounded-lg" />
          <div className="w-[140px] h-9 bg-muted rounded-lg" />
          <div className="w-[160px] h-9 bg-muted rounded-lg" />
          <div className="w-32 h-9 bg-muted rounded-lg" />
        </div>
      </div>
    </Card>
  )
}

export default AmenitiesSkeleton
