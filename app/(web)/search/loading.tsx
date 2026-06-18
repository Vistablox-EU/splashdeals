import { Skeleton } from "@/components/ui/skeleton"

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-background flex items-start justify-center pt-32 px-6">
      <div className="max-w-4xl w-full space-y-6">
        <Skeleton className="h-16 w-full bg-muted rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-muted rounded-[2.5rem] border border-border" />
          ))}
        </div>
      </div>
    </div>
  )
}
