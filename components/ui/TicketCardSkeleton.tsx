import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function TicketCardSkeleton() {
  return (
    <Card className="border-border flex h-full flex-col overflow-hidden">
      {/* Facility name + city skeleton */}
      <div className="flex flex-col gap-0.5 px-4 pt-4 sm:px-5 sm:pt-5">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      </div>

      {/* Image skeleton — aspect-[3/4] */}
      <div className="mx-4 mt-3 aspect-[3/4] w-[calc(100%-2rem)] overflow-hidden rounded-xl sm:mx-5 sm:w-[calc(100%-2.5rem)]">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      {/* Content skeleton */}
      <div className="flex flex-grow flex-col px-4 pt-3 pb-4 sm:px-5 sm:pb-5">
        <Skeleton className="mb-1 h-4 w-2/3 rounded-md" />
        <div className="mb-3 space-y-1">
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-5/6 rounded-md" />
        </div>

        {/* Footer skeleton */}
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-10 rounded-sm" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <Skeleton className="h-10 w-10 rounded-2xl" />
        </div>
      </div>
    </Card>
  );
}
