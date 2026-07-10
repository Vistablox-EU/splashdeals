import { Skeleton } from "@/components/ui/skeleton";

/**
 * 🌤️ WeatherBadgeSkeleton
 * Matches the capsule shape of the WeatherBadge island.
 */
export function WeatherBadgeSkeleton() {
  return <Skeleton className="bg-primary/10 border-border h-8 w-40 rounded-full border" />;
}

/**
 * 🕓 OperationalStatusSkeleton
 * Matches the double-pill status display.
 */
export function OperationalStatusSkeleton() {
  return <Skeleton className="bg-primary/5 border-border h-10 w-48 rounded-2xl border" />;
}

export function TicketGridSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse space-y-8 pb-24 md:pb-0">
      {/* Tabs Placeholder */}
      <div className="border-border bg-muted/20 flex h-14 w-full items-center gap-2 rounded-full border p-1">
        <Skeleton className="bg-muted/30 h-full w-32 rounded-full" />
        <Skeleton className="bg-muted/10 h-full w-28 rounded-full" />
        <Skeleton className="bg-muted/10 h-full w-36 animate-pulse rounded-full" />
      </div>

      {/* Desktop Layout Skeleton */}
      <div className="hidden gap-4 md:grid">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-border bg-muted/10 flex h-28 items-center justify-between rounded-3xl border p-6"
          >
            <div className="space-y-2">
              <Skeleton className="bg-muted/30 h-6 w-48 rounded-lg" />
              <div className="flex gap-4">
                <Skeleton className="bg-muted/10 h-4 w-24 rounded-md" />
                <Skeleton className="bg-muted/10 h-4 w-20 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Skeleton className="bg-muted/10 h-8 w-24 rounded-xl" />
              <div className="border-border bg-muted/40 flex h-10 w-24 items-center rounded-xl border p-1">
                <Skeleton className="bg-muted/10 h-full w-full rounded-lg" />
              </div>
              <Skeleton className="bg-primary/10 h-11 w-32 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Layout Skeleton */}
      <div className="block space-y-4 md:hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-border bg-muted/10 flex flex-col gap-5 rounded-3xl border p-6"
          >
            <div className="space-y-2">
              <Skeleton className="bg-muted/30 h-6 w-3/4 rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="bg-muted/10 h-4 w-16 rounded-md" />
                <Skeleton className="bg-muted/10 h-4 w-20 rounded-md" />
              </div>
            </div>
            <div className="bg-muted/20 h-px w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="bg-muted/10 h-6 w-24 rounded-md" />
            </div>
            <div className="bg-muted/20 h-px w-full" />
            <div className="flex gap-3">
              <div className="border-border bg-muted/40 flex h-12 w-28 items-center rounded-2xl border p-1">
                <Skeleton className="bg-muted/10 h-full w-full rounded-xl" />
              </div>
              <Skeleton className="bg-primary/15 h-12 w-full rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
