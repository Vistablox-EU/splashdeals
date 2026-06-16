/* eslint-disable @typescript-eslint/no-unused-vars */
 
import { Skeleton } from "@/components/ui/skeleton"

export default function OverviewLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 📊 Strategic Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 w-full rounded-2xl bg-white/[0.03] border border-white/5 relative overflow-hidden">
            <div className="absolute top-4 left-4 h-3 w-20 bg-white/5 rounded" />
            <div className="absolute bottom-4 left-4 h-8 w-24 bg-white/5 rounded" />
            <div className="absolute top-4 right-4 size-8 bg-white/5 rounded-lg" />
          </div>
        ))}
      </div>

      {/* 🏗️ Core Command Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="h-[420px] w-full rounded-3xl bg-white/[0.03] border border-white/5" />
          <div className="h-[300px] w-full rounded-3xl bg-white/[0.03] border border-white/5" />
        </div>
        <div className="lg:col-span-4">
          <div className="h-[600px] w-full rounded-3xl bg-white/[0.03] border border-white/5" />
        </div>
      </div>
    </div>
  )
}
