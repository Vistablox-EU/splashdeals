import { Skeleton } from "@/components/ui/skeleton"

export default function AuthLoading() {
  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-pulse">
      <div className="text-center space-y-3">
        <Skeleton className="h-16 w-16 rounded-2xl mx-auto bg-white/5" />
        <Skeleton className="h-8 w-48 mx-auto bg-white/5" />
      </div>
      <div className="space-y-4 mt-8">
        <Skeleton className="h-12 w-full rounded-xl bg-white/5" />
        <Skeleton className="h-12 w-full rounded-xl bg-white/5" />
        <Skeleton className="h-12 w-full rounded-xl bg-white/5" />
      </div>
    </div>
  )
}
