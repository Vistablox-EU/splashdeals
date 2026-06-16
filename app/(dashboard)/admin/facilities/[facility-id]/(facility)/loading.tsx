import { Skeleton } from "@/components/ui/skeleton"

export default function OverviewLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 📊 Strategic Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 w-full rounded-2xl bg-muted/20 border border-border/50 relative overflow-hidden">
            <div className="absolute top-4 left-4 h-3 w-20 bg-muted/30 rounded" />
            <div className="absolute bottom-4 left-4 h-8 w-24 bg-muted/30 rounded" />
            <div className="absolute top-4 right-4 size-8 bg-muted/30 rounded-lg" />
          </div>
        ))}
      </div>

      {/* 🏗️ Core Command Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="h-[420px] w-full rounded-3xl bg-muted/20 border border-border/50" />
          <div className="h-[300px] w-full rounded-3xl bg-muted/20 border border-border/50" />
        </div>
        <div className="lg:col-span-4">
          <div className="h-[600px] w-full rounded-3xl bg-muted/20 border border-border/50" />
        </div>
      </div>
    </div>
  )
}
