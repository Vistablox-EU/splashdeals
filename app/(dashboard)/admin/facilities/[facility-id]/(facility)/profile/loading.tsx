 
 
import { GlassCard } from "@/components/ui/GlassCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export default function ProfileLoading() {
  return (
    <div className="space-y-6 pb-20 relative animate-pulse">
      <div className="flex flex-col lg:flex-row gap-8 items-start relative mt-8">
        {/* 🧭 Nav Skeleton */}
        <div className="w-full lg:w-56 shrink-0 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl bg-white/5" />
          ))}
        </div>

        <div className="flex-1 w-full space-y-12">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <Skeleton className="size-10 rounded-lg bg-white/5" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40 bg-white/5" />
                <Skeleton className="h-3 w-64 bg-white/5" />
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-20 w-full rounded-xl bg-white/5" />
              <Separator className="bg-white/5" />
              <Skeleton className="h-64 w-full rounded-xl bg-white/5" />
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />
             <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  )
}
