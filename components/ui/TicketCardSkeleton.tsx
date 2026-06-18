import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function TicketCardSkeleton() {
  return (
    <Card className="h-full flex flex-col border-border overflow-hidden">
      {/* Image Block Skeleton */}
      <div className="relative h-52 w-full overflow-hidden rounded-t-[1.5rem]">
        <Skeleton className="w-full h-full rounded-none" />
        
        {/* Badge & Location Metadata Skeletons */}
        <div className="absolute bottom-4 left-4 z-20 space-y-3">
          <Skeleton className="h-5 w-20 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </div>
        </div>
      </div>

      {/* Content Section Skeleton */}
      <div className="p-6 flex flex-col flex-grow">
        <Skeleton className="h-6 w-3/4 rounded-lg mb-3" />
        <div className="space-y-2 mb-6">
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-5/6 rounded-md" />
        </div>

        {/* Footer Actions Skeleton */}
        <div className="mt-auto pt-6 flex justify-between items-end border-t border-border">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-2 w-8 rounded-sm" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
          
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
      </div>
    </Card>
  )
}
