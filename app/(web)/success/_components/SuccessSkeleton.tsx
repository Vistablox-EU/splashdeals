import { Skeleton } from "@/components/ui/skeleton";

export function SuccessSkeleton() {
  return (
    <div className="animate-pulse space-y-10 pt-6 sm:space-y-16 sm:pt-10">
      <div className="flex flex-col items-center gap-4 sm:gap-6">
        <Skeleton className="bg-muted border-border h-20 w-20 rounded-full border sm:h-24 sm:w-24" />
        <div className="flex w-full max-w-md flex-col items-center space-y-3 sm:space-y-4">
          <Skeleton className="bg-muted h-8 w-full max-w-xs sm:h-12 sm:max-w-sm" />
          <Skeleton className="bg-muted h-5 w-full max-w-[16rem] sm:h-6 sm:max-w-md" />
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:gap-8 md:grid-cols-2">
        <Skeleton className="bg-muted border-border h-56 rounded-3xl border sm:h-64" />
        <Skeleton className="bg-muted border-border h-56 rounded-3xl border sm:h-64" />
      </div>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
        <Skeleton className="bg-muted h-14 w-full max-w-xs rounded-full sm:w-48" />
        <Skeleton className="bg-muted h-14 w-full max-w-xs rounded-full sm:w-48" />
      </div>
    </div>
  );
}
