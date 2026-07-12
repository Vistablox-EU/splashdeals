import { Skeleton } from "@/components/ui/skeleton";

export default function TicketingLoading() {
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 pt-24 pb-32 sm:px-12">
      {/* Breadcrumb skeleton */}
      <div className="mb-8">
        <Skeleton className="bg-muted h-4 w-48 rounded" />
      </div>

      {/* Title skeleton */}
      <div className="mb-12">
        <Skeleton className="bg-muted mb-2 h-6 w-32 rounded-lg" />
        <Skeleton className="bg-muted h-12 w-96 rounded-2xl" />
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border-border bg-card overflow-hidden rounded-xl border">
            <Skeleton className="bg-muted h-40 w-full" />
            <div className="space-y-3 p-6">
              <Skeleton className="bg-muted h-5 w-3/4 rounded-lg" />
              <Skeleton className="bg-muted h-3 w-full rounded" />
              <Skeleton className="bg-muted h-3 w-2/3 rounded" />
              <div className="border-border pt-4">
                <Skeleton className="bg-muted h-8 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
