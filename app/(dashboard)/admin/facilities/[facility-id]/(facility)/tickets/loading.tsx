import { Skeleton } from "@/components/ui/skeleton"

export default function TicketManagementLoading() {
  return (
    <div className="flex h-full animate-in fade-in duration-500">
      {/* Left: Group panel skeleton */}
      <div className="hidden lg:flex lg:w-72 xl:w-80 flex-col border-r border-white/5 p-3 space-y-1.5">
        {/* Header */}
        <div className="flex items-center justify-between px-1 py-3 mb-1">
          <Skeleton className="h-3 w-24 bg-white/5" />
          <Skeleton className="h-7 w-7 rounded-lg bg-white/5" />
        </div>
        {/* All Tickets sentinel */}
        <Skeleton className="h-14 w-full rounded-xl bg-white/5" />
        {/* Group cards */}
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/5" />
        ))}
      </div>

      {/* Right: Ticket table skeleton */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
          <Skeleton className="h-3 w-32 bg-white/5" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-48 rounded-xl bg-white/5" />
            <Skeleton className="h-9 w-36 rounded-xl bg-white/5" />
          </div>
        </div>
        {/* Table rows */}
        <div className="flex-1 p-0">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-4 border-b border-white/5"
            >
              <Skeleton className="h-4 w-4 rounded bg-white/5" />
              <Skeleton className="h-8 w-12 rounded-lg bg-white/5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-40 bg-white/5" />
                <Skeleton className="h-2 w-20 bg-white/5" />
              </div>
              <Skeleton className="h-3 w-20 bg-white/5" />
              <Skeleton className="h-3 w-20 bg-white/5" />
              <Skeleton className="h-6 w-24 rounded-full bg-white/5" />
              <Skeleton className="h-5 w-20 rounded-md bg-white/5" />
              <Skeleton className="h-8 w-8 rounded-lg bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
