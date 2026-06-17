"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function AdminSkeleton() {
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar Placeholder */}
      <div className="hidden lg:flex flex-col w-[280px] border-r border-border/50 p-4 gap-4">
        <Skeleton className="h-8 w-40 bg-muted/30" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full bg-muted/30" />
          ))}
        </div>
        <div className="mt-auto pt-4 border-t border-border/50 space-y-2">
          <Skeleton className="h-8 w-32 bg-muted/30" />
          <Skeleton className="h-4 w-24 bg-muted/30" />
        </div>
      </div>

      {/* Main Content Placeholder */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-[60px] border-b border-border/50 flex items-center px-6 gap-4">
          <Skeleton className="h-8 w-8 bg-muted/30" />
          <Skeleton className="h-4 w-96 bg-muted/30" />
          <div className="ml-auto flex items-center gap-3">
            <Skeleton className="h-8 w-8 bg-muted/30 rounded-full" />
            <Skeleton className="h-8 w-24 bg-muted/30 rounded-full" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <Skeleton className="h-10 w-64 bg-muted/30" />
          <Skeleton className="h-5 w-96 bg-muted/30 mt-2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-muted/30 rounded-xl" />
            ))}
          </div>
          <div className="mt-8 space-y-3">
            <Skeleton className="h-8 w-full bg-muted/30" />
            <Skeleton className="h-8 w-full bg-muted/30" />
            <Skeleton className="h-8 w-full bg-muted/30" />
            <Skeleton className="h-8 w-full bg-muted/30" />
          </div>
        </div>
      </div>
    </div>
  )
}
