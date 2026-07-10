import { Skeleton } from "@/components/ui/skeleton";

export default function FacilitiesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 lg:p-10">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="bg-muted/30 h-24 w-full rounded-xl" />
        ))}
      </div>

      {/* Header with CTA */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton className="bg-muted/30 h-10 w-64" />
          <Skeleton className="bg-muted/30 h-4 w-96" />
        </div>
        <Skeleton className="bg-muted/30 h-12 w-48 rounded-xl" />
      </div>

      {/* Table */}
      <div className="mt-4 space-y-4">
        <Skeleton className="bg-muted/30 h-10 w-full rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="bg-muted/30 h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
