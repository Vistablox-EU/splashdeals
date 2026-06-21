import { Card } from "@/components/ui/card";

/**
 * 🦴 CategoryOrbSkeleton
 * Mirroring the Category Orb layout for zero-CLS streaming.
 */
export function CategoryOrbSkeleton() {
  return (
    <Card className="p-6 text-center border-border relative overflow-hidden">
      <div className="flex flex-col items-center">
        {/* Unit count placeholder */}
        <div className="h-2 w-16 bg-muted rounded animate-pulse mb-3" />
        {/* Category name placeholder */}
        <div className="h-5 w-24 bg-muted/80 rounded animate-pulse" />
      </div>
      
      {/* Decorative filter icon ghost */}
      <div className="absolute top-0 right-0 p-2 opacity-5">
         <div className="w-12 h-12 bg-white/20 rounded-full" />
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
    <Card className="h-[400px] flex flex-col border-border relative group overflow-hidden">
      {/* Ghost Background Image */}
      <div className="absolute inset-0 bg-muted group-hover:scale-110 transition-transform duration-1000" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

      {/* Content Skeleton */}
      <div className="relative z-10 mt-auto p-10">
         {/* Category tag */}
         <div className="h-2 w-20 bg-primary/10 rounded animate-pulse mb-4" />
         
         {/* Title placeholder */}
         <div className="h-8 w-3/4 bg-muted rounded animate-pulse mb-6" />
         
         <div className="flex items-center justify-between">
            {/* Address ghost */}
            <div className="flex items-center gap-2">
               <div className="w-3.5 h-3.5 bg-muted rounded-full" />
               <div className="h-2 w-24 bg-muted rounded" />
            </div>
            
            {/* Price ghost */}
            <div className="flex items-end gap-1">
               <div className="h-2 w-6 bg-muted rounded mb-1" />
               <div className="h-6 w-16 bg-primary/10 rounded" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryOrbSkeleton key={i} />
      ))}
    </div>
  );
}
