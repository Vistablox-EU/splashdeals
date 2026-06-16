 
 
import { Skeleton } from "@/components/ui/skeleton"

export default function MediaLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <Skeleton className="h-48 w-full rounded-xl bg-white/5 border-2 border-dashed border-white/5" />
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <Skeleton key={i} className="aspect-square rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  )
}
