import { Skeleton } from "@/components/ui/skeleton";

export default function FacilityRouteLoading() {
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 pt-20 pb-24 sm:px-12">
      <div className="bg-muted/30 mb-8 h-[36vh] w-full animate-pulse rounded-[2rem] md:h-[50vh]" />
      <div className="space-y-6">
        <Skeleton className="bg-muted mx-auto h-8 w-48 rounded-lg" />
        <Skeleton className="bg-muted mx-auto h-12 w-80 max-w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="bg-muted h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
