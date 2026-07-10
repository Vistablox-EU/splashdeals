import { Skeleton } from "@/components/ui/skeleton";

export default function CatchAllLoading() {
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 pt-16 pb-32 sm:px-12">
      <div className="mb-12">
        <Skeleton className="bg-muted h-4 w-40" />
      </div>
      <div className="mb-20 max-w-3xl">
        <Skeleton className="bg-muted mb-4 h-4 w-24" />
        <Skeleton className="bg-muted mb-2 h-16 w-full max-w-2xl" />
        <Skeleton className="bg-muted h-16 w-3/4" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="bg-muted h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
