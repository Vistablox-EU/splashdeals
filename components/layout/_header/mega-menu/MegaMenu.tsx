"use client";

import { useState, useEffect, useMemo } from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Icon } from "@/components/ui/Icon";
import { SectionRenderer } from "./sections";
import type { NavigationMenuData, DiscoveryMenuData } from "./types";
import { getMenusAction, getDiscoveryAction } from "@/app/(server)/actions/navigation";

// ── Skeleton ─────────────────────────────────────────────────────────

function MenuSkeleton() {
  return (
    <div className="text-muted-foreground flex items-center gap-2 px-3 py-1.5 text-xs">
      <div className="bg-muted h-5 w-32 animate-pulse rounded" aria-label="Učitavanje menija" />
    </div>
  );
}

// ── Constants ────────────────────────────────────────────────────────

const POPULAR_CITY_SLUGS = [
  "belgrade",
  "beograd",
  "novi-sad",
  "jagodina",
  "vrnjacka-banja",
  "subotica",
];

// ── Main component ──────────────────────────────────────────────────

export function MegaMenu({ side = "left" }: { side?: "left" | "right" }) {
  const [menus, setMenus] = useState<NavigationMenuData[]>([]);
  const [discovery, setDiscovery] = useState<DiscoveryMenuData>({ cities: [], featured: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [menuResult, discoveryResult] = await Promise.all([
          getMenusAction(),
          getDiscoveryAction(),
        ]);
        if (cancelled) return;
        if (menuResult.success && menuResult.data)
          setMenus((menuResult.data as { menus: NavigationMenuData[] }).menus);
        if (discoveryResult.success && discoveryResult.data)
          setDiscovery(discoveryResult.data as unknown as DiscoveryMenuData);
        if (!menuResult.success || !discoveryResult.success) {
          setError("Failed to load navigation data");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Menu fetch failed:", err);
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // Re-trigger the effect by forcing a re-render with a key change
    // Use a simpler approach: inline the fetch
    const fetchData = async () => {
      try {
        const [menuResult, discoveryResult] = await Promise.all([
          getMenusAction(),
          getDiscoveryAction(),
        ]);
        if (menuResult.success && menuResult.data)
          setMenus((menuResult.data as { menus: NavigationMenuData[] }).menus);
        if (discoveryResult.success && discoveryResult.data)
          setDiscovery(discoveryResult.data as unknown as DiscoveryMenuData);
        if (!menuResult.success || !discoveryResult.success) {
          setError("Failed to load navigation data");
        }
      } catch (err) {
        console.error("Menu fetch failed:", err);
        setError(err instanceof Error ? err.message : "Failed to load menu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  };

  const sortedCities = useMemo(() => {
    if (!discovery.cities?.length) return [];
    const popular = discovery.cities.filter((c) =>
      POPULAR_CITY_SLUGS.includes(c.slug.toLowerCase()),
    );
    const others = discovery.cities.filter(
      (c) => !POPULAR_CITY_SLUGS.includes(c.slug.toLowerCase()),
    );
    return [...popular, ...others];
  }, [discovery.cities]);

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
    );
  }

  if (error) {
    return (
      <nav aria-label="Glavna navigacija">
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <li className="text-muted-foreground flex items-center gap-3 px-3 py-1.5 text-xs">
              <span>Meni nije dostupan</span>
              <button
                onClick={handleRetry}
                className="bg-muted hover:bg-muted/80 text-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold transition-colors"
                aria-label="Pokušaj ponovo"
              >
                <Icon name="refresh" className="size-3" />
                Pokušaj ponovo
              </button>
            </li>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
    );
  }

  return (
    <nav aria-label="Glavna navigacija">
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          {filteredMenus.length === 0 ? (
            <li className="text-muted-foreground flex items-center gap-2 px-3 py-1.5 text-xs">
              Meni nije dostupan
            </li>
          ) : (
            filteredMenus.map((menu) => (
              <NavigationMenuItem key={menu.id}>
                <NavigationMenuTrigger className="data-[state=open]:text-primary h-9 gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors">
                  <Icon name={menu.icon} className="text-primary/70 size-4" aria-hidden="true" />
                  {menu.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[900px] p-6">
                    <div className="grid grid-cols-[2fr_1fr_1fr] gap-6">
                      {[0, 1, 2].map((column) => {
                        const sections = menu.sections.filter((s) => s.column === column);
                        return (
                          <div key={column} className="space-y-4">
                            {sections.map((section) => (
                              <SectionRenderer
                                key={section.id}
                                section={section}
                                menu={menu}
                                sortedCities={sortedCities}
                              />
                            ))}
                          </div>
                        );
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
  );
}
