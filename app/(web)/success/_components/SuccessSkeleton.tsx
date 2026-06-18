import { Skeleton } from "@/components/ui/skeleton";

export function SuccessSkeleton() {
  return (
    <div className="space-y-16 animate-pulse pt-10">
      <div className="flex flex-col items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-full bg-muted border border-border" />
        <div className="space-y-4 flex flex-col items-center">
            <Skeleton className="h-12 w-80 bg-muted" />
            <Skeleton className="h-6 w-96 bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <Skeleton className="h-64 rounded-3xl bg-muted border border-border" />
        <Skeleton className="h-64 rounded-3xl bg-muted border border-border" />
      </div>
      <div className="flex justify-center gap-6">
        <Skeleton className="h-14 w-48 rounded-full bg-muted" />
        <Skeleton className="h-14 w-48 rounded-full bg-muted" />
      </div>
    </div>
  );
}
