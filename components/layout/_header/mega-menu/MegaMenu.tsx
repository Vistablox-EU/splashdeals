"use client"

import { useState, useEffect, useMemo } from "react"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Icon } from "@/components/ui/Icon"
import { SectionRenderer } from "./sections"
import type { NavigationMenuData, DiscoveryMenuData } from "./types"
import { getMenusAction, getDiscoveryAction } from "@/app/(server)/actions/navigation"

// ── Skeleton ─────────────────────────────────────────────────────────

function MenuSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
      <div className="h-5 w-32 animate-pulse rounded bg-muted" aria-label="Učitavanje menija" />
    </div>
  )
}

// ── Constants ────────────────────────────────────────────────────────

const POPULAR_CITY_SLUGS = [
  "belgrade", "beograd", "novi-sad", "jagodina",
  "vrnjacka-banja", "subotica",
]

// ── Main component ──────────────────────────────────────────────────

export function MegaMenu({ side = "left" }: { side?: "left" | "right" }) {
  const [menus, setMenus] = useState<NavigationMenuData[]>([])
  const [discovery, setDiscovery] = useState<DiscoveryMenuData>({ cities: [], featured: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuResult, discoveryResult] = await Promise.all([
          getMenusAction(),
          getDiscoveryAction(),
        ])
        if (menuResult.success && menuResult.data) setMenus((menuResult.data as { menus: NavigationMenuData[] }).menus)
        if (discoveryResult.success && discoveryResult.data) setDiscovery(discoveryResult.data as unknown as DiscoveryMenuData)
      } catch (error) {
        console.error("Menu fetch failed:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const sortedCities = useMemo(() => {
    if (!discovery.cities?.length) return []
    const popular = discovery.cities.filter((c) =>
      POPULAR_CITY_SLUGS.includes(c.slug.toLowerCase()),
    )
    const others = discovery.cities.filter(
      (c) => !POPULAR_CITY_SLUGS.includes(c.slug.toLowerCase()),
    )
    return [...popular, ...others]
  }, [discovery.cities])

  const filteredMenus = useMemo(
    () => menus.filter((m) => (m.placement || "left") === side),
    [menus, side],
  );

  if (loading) {
    return (
      <nav aria-label="Glavna navigacija">
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <MenuSkeleton />
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
    )
  }

  return (
    <nav aria-label="Glavna navigacija">
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          {filteredMenus.length === 0 ? (
            <li className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
              Meni nije dostupan
            </li>
          ) : (
            filteredMenus.map((menu) => (
              <NavigationMenuItem key={menu.id}>
                <NavigationMenuTrigger className="h-9 px-3 py-1.5 text-xs font-bold uppercase tracking-wider gap-1.5 data-[state=open]:text-primary rounded-xl transition-colors">
                  <Icon name={menu.icon} className="size-4 text-primary/70" aria-hidden="true" />
                  {menu.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[900px] p-6">
                    <div className="grid grid-cols-[2fr_1fr_1fr] gap-6">
                      {[0, 1, 2].map((column) => {
                        const sections = menu.sections.filter((s) => s.column === column)
                        return (
                          <div key={column} className="space-y-4">
                            {sections.map((section) => (
                              <SectionRenderer
                                key={section.id}
                                section={section}
                                menu={menu}
                                sortedCities={sortedCities}
                                loadingCities={false}
                              />
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  )
}
