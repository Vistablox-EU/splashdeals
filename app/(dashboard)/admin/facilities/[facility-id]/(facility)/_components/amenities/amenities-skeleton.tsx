"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { GlassCard } from "@/components/ui/GlassCard"

export function AmenitiesSkeleton() {
  return (
    <GlassCard className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl p-6 space-y-6 shadow-2xl relative overflow-hidden animate-pulse">
      {/* Search and filter bar skeletons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full max-w-md h-9 bg-slate-950/40 rounded-lg border border-white/5 flex items-center px-3 gap-2">
          <div className="size-4 rounded bg-slate-800" />
          <div className="h-3 w-32 bg-slate-850 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-28 bg-slate-850 rounded" />
          <div className="h-6 w-10 bg-slate-800 rounded-full" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-950/20">
        <div className="divide-y divide-white/5">
          {/* Header row skeleton */}
          <div className="grid grid-cols-6 gap-4 p-4 bg-slate-950/60 border-b border-white/5">
            <div className="h-3 w-16 bg-slate-800 rounded" />
            <div className="h-3 w-28 bg-slate-800 rounded" />
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-3 w-24 bg-slate-800 rounded" />
            <div className="h-3 w-12 bg-slate-800 rounded mx-auto" />
            <div className="h-3 w-8 bg-slate-800 rounded ml-auto" />
          </div>

          {/* Data row skeletons */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-6 gap-4 p-4 items-center">
              <div className="h-6 w-10 bg-slate-900 rounded-full" />
              <div className="h-4 w-32 bg-slate-900 rounded" />
              <div className="h-5 w-16 bg-slate-900 rounded-full" />
              <div className="h-8 w-36 bg-slate-900 rounded-lg" />
              <div className="h-5 w-5 bg-slate-900 rounded mx-auto" />
              <div className="h-6 w-6 bg-slate-900 rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Add Infrastructure footer skeleton */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <div className="h-3 w-48 bg-slate-800 rounded" />
        <div className="flex flex-col md:flex-row items-center gap-3 bg-slate-950/40 p-4 border border-white/5 rounded-xl">
          <div className="flex-1 h-9 bg-slate-900 rounded-lg" />
          <div className="w-[140px] h-9 bg-slate-900 rounded-lg" />
          <div className="w-[160px] h-9 bg-slate-900 rounded-lg" />
          <div className="w-32 h-9 bg-slate-800 rounded-lg" />
        </div>
      </div>
    </GlassCard>
  )
}

export default AmenitiesSkeleton
