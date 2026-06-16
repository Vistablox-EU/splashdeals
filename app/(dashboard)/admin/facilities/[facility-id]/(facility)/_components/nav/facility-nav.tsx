"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { StatusToggle } from "@/components/admin/StatusToggle"
import { FacilityGovernanceSheet } from "./facility-governance-sheet"
import { FacilityStatus } from "@prisma/client"

interface FacilityNavProps {
  facility: {
    id: string
    name: string
    status: FacilityStatus
  }
  counts?: {
    tickets: number
    media: number
    amenities: number
    ticketGroups?: number
  }
}

/**
 * 🌊 FacilityNav (ShadCN Idiomatic)
 * 
 * Optimized for High-Density admin tasks. 
 * Follows composition-first principles and strict design token adherence.
 */
export function FacilityNav({ facility, counts }: FacilityNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const isTabActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const tabs = React.useMemo(() => [
      { title: "Overview", href: `/admin/facilities/${facility.id}`, icon: "dashboard", active: isTabActive(`/admin/facilities/${facility.id}`, true) },
      { 
        title: "Ticket Management", 
        href: `/admin/facilities/${facility.id}/tickets`, 
        icon: "confirmation_number", 
        active: isTabActive(`/admin/facilities/${facility.id}/tickets`),
        count: (counts?.tickets ?? 0) + (counts?.ticketGroups ?? 0) || undefined
      },
      { 
        title: "Profile", 
        href: `/admin/facilities/${facility.id}/profile`, 
        icon: "account_circle", 
        active: isTabActive(`/admin/facilities/${facility.id}/profile`, true) 
      },
      { 
        title: "Amenities", 
        href: `/admin/facilities/${facility.id}/amenities`, 
        icon: "grid_view", 
        active: isTabActive(`/admin/facilities/${facility.id}/amenities`), 
        count: counts?.amenities 
      },
      { title: "Operations", href: `/admin/facilities/${facility.id}/operations`, icon: "schedule", active: isTabActive(`/admin/facilities/${facility.id}/operations`) },
      { title: "Media Gallery", href: `/admin/facilities/${facility.id}/media`, icon: "photo_library", active: isTabActive(`/admin/facilities/${facility.id}/media`), count: counts?.media },
    ], [facility.id, pathname, counts])

  const currentModule = React.useMemo(() => tabs.find(t => t.active) || tabs[0], [tabs])

  // Handlers
  const handleSubNavClick = (item: { id: string; href?: string }) => {
    if (item.href) {
      router.push(item.href)
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set('section', item.id)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-slate-950/95 backdrop-blur-xl" aria-label="Facility Navigation Authority">
      <div className="container flex h-16 max-w-[1600px] items-center gap-4 lg:gap-6">
        
        {/* 🏢 Left: Branding & Module Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <SidebarTrigger className="h-9 w-9 rounded-xl hover:bg-accent hover:text-accent-foreground" />
            <Link 
              href="/admin/facilities" 
              className="group inline-flex items-center justify-center rounded-md p-2 text-sm font-medium text-muted-foreground transition-colors hover:text-cyan-400"
              title="Back to Facilities"
            >
              <Icon name="keyboard_arrow_left" className="text-[16px] transition-transform group-hover:-translate-x-0.5" />
            </Link>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group flex items-center gap-4 rounded-xl px-3 py-1.5 outline-none transition-all hover:bg-accent">
                <div className="flex flex-col items-start text-left leading-none">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/80 group-hover:text-cyan-400">
                    {currentModule.title}
                  </span>
                  <h2 className="mt-1 max-w-[140px] truncate italic text-sm font-black uppercase tracking-tight text-foreground lg:max-w-[200px]">
                    {facility.name}
                  </h2>
                </div>
                 <div className="flex size-5 items-center justify-center rounded-md bg-muted transition-all group-hover:bg-cyan-500/20">
                    <Icon name="keyboard_arrow_down" className="text-[12px] text-muted-foreground transition-transform group-hover:text-cyan-400 group-data-[state=open]:rotate-180" />
                 </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-xl p-2 bg-slate-950/98 border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
               {/* 🚀 Status Promoted to Header */}
               <div className="mb-2 rounded-lg border border-border bg-muted/50 px-2 py-3">
                 <div className="mb-3 flex items-center justify-between px-1">
                   <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Live Status</span>
                   <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                 </div>
                 <StatusToggle facilityId={facility.id} status={facility.status} compact />
               </div>

               <div className="px-2 py-1.5">
                 <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Facility Modules</span>
               </div>
               {tabs.map((tab) => (
                 <DropdownMenuItem key={tab.href} asChild>
                   <Link 
                     href={tab.href}
                     className={cn(
                       "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition-all",
                       tab.active ? "bg-cyan-500/10 text-cyan-400" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                     )}
                   >
                     <Icon name={tab.icon} className="text-[14px]" />
                     <span>{tab.title}</span>
                     {tab.count !== undefined && (
                       <span className="ml-auto font-mono text-[10px] tracking-tighter opacity-40">{tab.count}</span>
                     )}
                   </Link>
                 </DropdownMenuItem>
               ))}
               <DropdownMenuSeparator />
               <div className="flex items-center justify-between px-2 py-2 font-mono text-[10px] uppercase tracking-tighter text-muted-foreground">
                 <span>ID: {facility.id.slice(0, 8)}...</span>
                 <span>PPR 16.0</span>
               </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 🧭 Middle: empty on ticket management page (no sub-nav needed) */}
        <div className="flex flex-1 items-center justify-center overflow-x-auto no-scrollbar" />

        {/* 🛠️ Right: Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <Separator orientation="vertical" className="hidden h-8 lg:block" />
          <FacilityGovernanceSheet facility={facility} />
        </div>
      </div>
    </nav>
  )
}

export function FacilityNavSkeleton() {
  return (
    <div className="w-full border-b border-border bg-slate-950/95 h-16 overflow-hidden">
      <div className="container flex h-full max-w-[1600px] items-center gap-6 px-4">
        <div className="flex items-center gap-3 w-[280px]">
          <Skeleton className="size-9 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-2 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex flex-1 justify-center">
          <Skeleton className="h-9 w-64 rounded-xl" />
        </div>
        <div className="w-10">
          <Skeleton className="size-9 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
