"use client"

import Image from "next/image"
import { useBreadcrumbs } from "@/app/(dashboard)/admin/_common/breadcrumb-context"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumbs } from "@/app/(dashboard)/admin/_common/breadcrumbs"
import { Suspense } from "react"
import { cn } from "@/lib/utils"

interface AdminLayoutShellProps {
  children: React.ReactNode
  user: {
    name?: string | null
    image?: string | null
  }
}

export function AdminLayoutShell({ children, user }: AdminLayoutShellProps) {
  const { hideGlobalHeader } = useBreadcrumbs()
  const nodeLabel = process.env.NEXT_PUBLIC_ADMIN_NODE_LABEL || (process.env.NODE_ENV === "production" ? "PROD" : "DEV")

  return (
    <>
      <header 
        className={cn(
          "admin-global-header sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border/50 bg-background/50 backdrop-blur-xl px-4 md:px-6 transition-all duration-300",
          hideGlobalHeader && "opacity-0 pointer-events-none h-0 border-none overflow-hidden"
        )}
      >
        <SidebarTrigger className="-ml-2 h-9 w-9 rounded-xl hover:bg-muted/30 hover:text-primary transition-all" />
        <Separator orientation="vertical" className="h-4 bg-muted/50" />
        <div className="flex-1 min-w-0 overflow-hidden">
          <Suspense fallback={<div className="h-4 w-32 bg-muted/30 animate-pulse rounded" />}>
            <div className="truncate whitespace-nowrap">
              <Breadcrumbs />
            </div>
          </Suspense>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 border border-border/50">
              <div className="h-1 w-1 rounded-full bg-primary" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Node: {nodeLabel}</span>
          </div>
          
          <div className="flex items-center gap-2 px-1.5 py-1 rounded-full bg-muted/30 border border-border">
            {user.image ? (
              <div className="relative h-5 w-5 rounded-full overflow-hidden border border-border">
                <Image src={user.image} alt={user.name || ""} fill className="object-cover" />
              </div>
            ) : (
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-black text-primary border border-primary/20 uppercase">
                {user.name?.[0] || "?"}
              </div>
            )}
            <span className="hidden sm:inline text-[9px] font-bold text-foreground/80 pr-1.5 uppercase tracking-tighter">
              {user.name?.split(' ')[0]}
            </span>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {children}
      </main>
    </>
  )
}
