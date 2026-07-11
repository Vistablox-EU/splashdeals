import { Skeleton } from "@/components/ui/skeleton";

export default function MediaLibraryLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <Skeleton className="bg-muted/20 h-8 w-64" />
        <Skeleton className="bg-muted/20 mt-2 h-5 w-80" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="bg-muted/20 h-10 flex-1 rounded-[2rem]" />
        <Skeleton className="bg-muted/20 h-10 w-32 rounded-[2rem]" />
        <Skeleton className="bg-muted/20 h-10 w-24 rounded-[2rem]" />
      </div>

      {/* Grid skeleton: 2 rows of 4 cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="bg-muted/20 aspect-square w-full rounded-[1rem]" />
            <Skeleton className="bg-muted/20 h-4 w-3/4" />
            <Skeleton className="bg-muted/20 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
