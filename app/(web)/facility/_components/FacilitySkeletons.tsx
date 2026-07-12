import { Card } from "@/components/ui/card";

/**
 * 🦴 CategoryOrbSkeleton
 * Mirroring the Category Orb layout for zero-CLS streaming.
 */
export function CategoryOrbSkeleton() {
  return (
    <Card className="border-border relative overflow-hidden p-6 text-center">
      <div className="flex flex-col items-center">
        {/* Unit count placeholder */}
        <div className="bg-muted mb-3 h-2 w-16 animate-pulse rounded" />
        {/* Category name placeholder */}
        <div className="bg-muted/80 h-5 w-24 animate-pulse rounded" />
      </div>

      {/* Decorative filter icon ghost */}
      <div className="absolute top-0 right-0 p-2 opacity-5">
        <div className="bg-foreground/10 h-12 w-12 rounded-full" />
      </div>
    </Card>
  );
}

/**
 * 🦴 FacilityCardSkeleton
 * Mirroring the Facility Card layout for zero-CLS streaming.
 */
export function FacilityCardSkeleton() {
  return (
    <Card className="border-border group relative flex h-[400px] flex-col overflow-hidden">
      {/* Ghost Background Image */}
      <div className="bg-muted absolute inset-0 transition-transform duration-1000 group-hover:scale-110" />
      <div className="from-background via-background/40 absolute inset-0 bg-gradient-to-t to-transparent" />

      {/* Content Skeleton */}
      <div className="relative z-10 mt-auto p-10">
        {/* Category tag */}
        <div className="bg-primary/10 mb-4 h-2 w-20 animate-pulse rounded" />

        {/* Title placeholder */}
        <div className="bg-muted mb-6 h-8 w-3/4 animate-pulse rounded" />

        <div className="flex items-center justify-between">
          {/* Address ghost */}
          <div className="flex items-center gap-2">
            <div className="bg-muted h-3.5 w-3.5 rounded-full" />
            <div className="bg-muted h-2 w-24 rounded" />
          </div>

          {/* Price ghost */}
          <div className="flex items-end gap-1">
            <div className="bg-muted mb-1 h-2 w-6 rounded" />
            <div className="bg-primary/10 h-6 w-16 rounded" />
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * 🦴 FacilityGridSkeleton
 */
export function FacilityGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <FacilityCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 🦴 CategoryGridSkeleton
 */
export function CategoryGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryOrbSkeleton key={i} />
      ))}
    </div>
  );
}
