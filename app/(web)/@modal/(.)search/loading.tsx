import { Skeleton } from "@/components/ui/skeleton"

export default function InterceptedSearchLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-start justify-center pt-32 px-6 animate-pulse">
      <div className="max-w-3xl w-full bg-navy-deep/90 border border-border p-8 rounded-[2.5rem] shadow-2xl space-y-6">
        <Skeleton className="h-14 w-full bg-muted rounded-2xl" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-1/3 bg-muted rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-muted rounded-2xl border border-border" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
