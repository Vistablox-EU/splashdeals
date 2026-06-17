"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useBreadcrumbs } from "./breadcrumb-context"

const HUMANIZED_LABELS: Record<string, string> = {
  admin: "Dashboard",
  facilities: "Facilities",
  tickets: "Tickets",
  media: "Media Assets",
  profile: "Profile Settings",
  support: "Security & Ops",
  system: "System",
  settings: "Settings",
  governance: "Governance",
  amenities: "Amenities",
  tiers: "Tiers",
  groups: "Groups",
}

export function Breadcrumbs() {
  const rawPathname = usePathname() || ""
  const { overrides } = useBreadcrumbs()
  const pathname = rawPathname.replace(/^\/(en|rs)/, "") || "/"
  
  const segments = pathname.split("/").filter(Boolean)
  
  // Skip the first "admin" segment if it's there for the loop, 
  // but keep track of it for href construction
  const breadcrumbSegments = segments.length > 0 && segments[0] === "admin" 
    ? segments.slice(1) 
    : segments

  if (breadcrumbSegments.length === 0) return null

  return (
    <nav className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
      <Link 
        href="/admin" 
        className="hover:text-primary transition-colors flex items-center gap-1 group"
      >
        <Icon name="home" className="text-[12px] group-hover:scale-110 transition-transform" />
      </Link>
      
      {breadcrumbSegments.map((segment, index) => {
        // Construct href based on index in breadcrumbSegments, 
        // accounting for the omitted "admin" if it was there
        const fullSegments = segments[0] === "admin" 
          ? ["admin", ...breadcrumbSegments.slice(0, index + 1)]
          : breadcrumbSegments.slice(0, index + 1)
          
        const href = `/${fullSegments.join("/")}`
        const isLast = index === breadcrumbSegments.length - 1
        
        // 1. Check Context Overrides (for UUIDs)
        // 2. Check Static Humanized Map
        // 3. Fallback to Capitalized string with dashes replaced
        let label = overrides[segment] || HUMANIZED_LABELS[segment.toLowerCase()]
        
        if (!label) {
          label = segment
            .replace(/-/g, " ")
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        }

        // Handle case where UUID is still a UUID (no override)
        if (segment.length > 20 && !overrides[segment]) {
          label = "Details"
        }

        return (
          <React.Fragment key={href}>
            <Icon name="keyboard_arrow_right" className="text-[10px] opacity-40" />
            <Link
              href={href}
              className={cn(
                "transition-colors",
                isLast ? "text-primary font-black" : "hover:text-foreground"
              )}
              aria-current={isLast ? "page" : undefined}
            >
              {label}
            </Link>
          </React.Fragment>
        )
      })}
    </nav>
  )
}
