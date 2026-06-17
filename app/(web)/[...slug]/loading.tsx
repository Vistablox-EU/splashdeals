import { Skeleton } from "@/components/ui/skeleton";

export default function CatchAllLoading() {
  return (
    <div className="min-h-screen pb-32 pt-16 px-6 sm:px-12 max-w-7xl mx-auto">
      <div className="mb-12">
        <Skeleton className="h-4 w-40 bg-slate-800" />
      </div>
      <div className="max-w-3xl mb-20">
        <Skeleton className="h-4 w-24 mb-4 bg-slate-800" />
        <Skeleton className="h-16 w-full max-w-2xl mb-2 bg-slate-800" />
        <Skeleton className="h-16 w-3/4 bg-slate-800" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-72 rounded-xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}
