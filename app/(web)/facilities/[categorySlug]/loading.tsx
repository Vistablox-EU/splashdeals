import { Skeleton } from "@/components/ui/skeleton"
import { FacilityGridSkeleton } from "../_components/FacilitySkeletons"

export default function DiscoveryLoading() {
  return (
    <div className="min-h-screen pb-32 pt-16 px-6 sm:px-12 max-w-7xl mx-auto animate-pulse">
      {/* 🧭 BREADCRUMBS SKELETON */}
      <div className="flex items-center gap-2 mb-12">
        <Skeleton className="h-4 w-12 bg-muted rounded" />
        <span className="text-muted-foreground/40">/</span>
        <Skeleton className="h-4 w-20 bg-muted rounded" />
        <span className="text-muted-foreground/40">/</span>
        <Skeleton className="h-4 w-24 bg-muted rounded" />
      </div>

      {/* 🏙️ DISCOVERY HEADER SKELETON */}
      <header className="mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="max-w-3xl space-y-4">
            <Skeleton className="h-3 w-40 bg-muted rounded animate-pulse" />
            <div className="space-y-3">
              <Skeleton className="h-16 sm:h-20 w-3/4 bg-muted rounded" />
              <Skeleton className="h-16 sm:h-20 w-1/2 bg-muted rounded" />
            </div>
          </div>

          <Skeleton className="h-9 w-36 rounded-full bg-muted" />
        </div>
      </header>

      {/* 🚀 FACILITIES GRID SKELETON */}
      <section>
        <FacilityGridSkeleton count={3} />
      </section>
    </div>
  )
}
