import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CartLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-28 sm:px-12 sm:pt-12 sm:pb-32">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
        <div className="flex-grow space-y-4 sm:space-y-8">
          <div className="flex items-center justify-between">
            <Skeleton className="bg-muted h-6 w-28 rounded-lg sm:h-8 sm:w-44" />
          </div>

          <div className="space-y-3 sm:space-y-4">
            {[1, 2].map((i) => (
              <Card
                key={i}
                className="border-border from-muted bg-gradient-to-r to-transparent p-4 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                  <div className="flex items-center gap-3 sm:gap-8">
                    <div className="bg-muted h-16 w-16 flex-shrink-0 rounded-2xl sm:h-20 sm:w-20" />
                    <div className="w-full flex-grow space-y-2 sm:space-y-3">
                      <Skeleton className="bg-muted h-4 w-24 rounded-full" />
                      <Skeleton className="bg-muted h-5 w-40 rounded-lg sm:h-6 sm:w-48" />
                      <Skeleton className="bg-muted h-4 w-28 rounded-md sm:w-32" />
                    </div>
                  </div>
                  <div className="bg-muted h-11 w-full rounded-2xl sm:h-14 sm:w-32 sm:flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="w-full flex-shrink-0 space-y-4 pt-2 sm:space-y-6 lg:w-96 lg:pt-0">
          <Card className="border-primary/10 bg-card/50 relative space-y-6 overflow-hidden p-5 sm:space-y-8 sm:p-8">
            <div className="space-y-4">
              <Skeleton className="bg-muted h-6 w-36 rounded-lg" />
              <Skeleton className="bg-muted h-10 w-28 rounded-xl" />
            </div>

            <div className="border-border space-y-3 border-t pt-6">
              <div className="flex justify-between">
                <Skeleton className="bg-muted h-4 w-20 rounded-md" />
                <Skeleton className="bg-muted h-4 w-16 rounded-md" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="bg-muted h-4 w-24 rounded-md" />
                <Skeleton className="bg-muted h-4 w-12 rounded-md" />
              </div>
            </div>

            <Skeleton className="bg-muted h-14 w-full rounded-2xl" />
          </Card>
        </div>
      </div>
    </div>
  );
}
