import { Skeleton } from "@/components/ui/skeleton"

export default function FacilitiesLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-10 max-w-[1400px] w-full mx-auto animate-pulse">
      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl bg-muted/30" />
        ))}
      </div>

      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 bg-muted/30" />
          <Skeleton className="h-4 w-96 bg-muted/30" />
        </div>
        <Skeleton className="h-12 w-48 bg-muted/30 rounded-xl" />
      </div>

      {/* Table */}
      <div className="mt-4 space-y-4">
        <Skeleton className="h-10 w-full rounded-lg bg-muted/30" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  )
}
