import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function TicketCardSkeleton() {
  return (
    <Card className="border-border flex h-full flex-col overflow-hidden">
      {/* Facility name + city skeleton */}
      <div className="flex flex-col gap-0.5 px-3 pt-3 sm:px-4 sm:pt-4">
        <Skeleton className="h-3 w-3/4 rounded-md" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-1/2 rounded-md" />
        </div>
      </div>

      {/* Image skeleton — aspect-square */}
      <div className="mx-3 mt-2 aspect-square w-[calc(100%-1.5rem)] overflow-hidden rounded-lg sm:mx-4 sm:w-[calc(100%-2rem)]">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      {/* Content skeleton */}
      <div className="flex flex-grow flex-col px-3 pt-2 pb-3 sm:px-4 sm:pb-4">
        <Skeleton className="mb-1 h-3 w-2/3 rounded-md" />

        {/* Footer skeleton */}
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-2 w-10 rounded-sm" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
          <Skeleton className="h-8 w-8 rounded-2xl" />
        </div>
      </div>
    </Card>
  );
}
