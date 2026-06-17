"use client"
import { Icon } from "@/components/ui/Icon";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { StatusToggle } from "@/app/(dashboard)/admin/_common/StatusToggle"
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

export function FacilityNav({ facility, counts }: FacilityNavProps) {
  const pathname = usePathname()

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  const b = `/admin/facilities/${facility.id}`

  const tabs = [
    { title: "Pregled", href: b, active: isActive(b, true), icon: "dashboard" },
    {
      title: "Ulaznice",
      href: `${b}/tickets`,
      active: isActive(`${b}/tickets`),
      icon: "confirmation_number",
      count: (counts?.tickets ?? 0) + (counts?.ticketGroups ?? 0) || undefined,
    },
    { title: "Profil", href: `${b}/profile`, active: isActive(`${b}/profile`, true), icon: "account_circle" },
    {
      title: "Sadržaji",
      href: `${b}/amenities`,
      active: isActive(`${b}/amenities`),
      icon: "grid_view",
      count: counts?.amenities,
    },
    { title: "Radno vreme", href: `${b}/operations`, active: isActive(`${b}/operations`), icon: "schedule" },
    {
      title: "Mediji",
      href: `${b}/media`,
      active: isActive(`${b}/media`),
      icon: "photo_library",
      count: counts?.media,
    },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-2 px-4">
        {/* Left */}
        <div className="flex items-center gap-1 shrink-0">
          <SidebarTrigger className="size-8 rounded-lg hover:bg-accent hover:text-accent-foreground" />
          <Button variant="ghost" size="icon" asChild className="size-8 rounded-lg text-muted-foreground hover:text-foreground">
            <Link href="/admin/facilities" title="Nazad na objekte">
              <Icon name="keyboard_arrow_left" className="size-4" />
            </Link>
          </Button>
        </div>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Facility name */}
        <div className="flex items-center gap-2 min-w-0 mr-2 shrink-0">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate max-w-[160px] sm:max-w-[240px]">
            {facility.name}
          </span>
          <div className="size-1.5 rounded-full bg-emerald-500 shrink-0" aria-label="Facility online" />
        </div>

        <Separator orientation="vertical" className="h-5 mr-2 hidden md:block" />

        {/* Center — Horizontal Tabs */}
        <div className="flex-1 flex items-center gap-0.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <Button
              key={tab.href}
              variant="ghost"
              asChild
              className={cn(
                "relative h-8 rounded-none px-3 text-xs font-medium transition-colors",
                tab.active
                  ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground after:rounded-full"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link href={tab.href}>
                <Icon name={tab.icon} className="size-3.5 mr-1.5 shrink-0" />
                {tab.title}
                {tab.count !== undefined && (
                  <span className="ml-1.5 font-mono text-[10px] text-muted-foreground/60">
                    {tab.count}
                  </span>
                )}
              </Link>
            </Button>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <Separator orientation="vertical" className="h-5 hidden md:block" />
          <div className="hidden sm:block">
            <StatusToggle facilityId={facility.id} status={facility.status} compact />
          </div>
          <FacilityGovernanceSheet facility={facility} />
        </div>
      </div>
    </nav>
  )
}

export function FacilityNavSkeleton() {
  return (
    <div className="w-full border-b border-border bg-background h-14">
      <div className="flex items-center gap-2 h-full px-4">
        <Skeleton className="size-8 rounded-lg shrink-0" />
        <Skeleton className="size-8 rounded-lg shrink-0" />
        <Skeleton className="h-5 w-px mx-1 shrink-0" />
        <Skeleton className="h-4 w-28 shrink-0" />
        <Skeleton className="h-5 w-px mx-2 shrink-0 hidden md:block" />
        <div className="flex-1 flex gap-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-none" />
          ))}
        </div>
        <Skeleton className="size-8 rounded-lg shrink-0" />
      </div>
    </div>
  )
}
