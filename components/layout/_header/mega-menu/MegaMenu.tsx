"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { SectionRenderer } from "./sections";
import type { NavigationMenuData, DiscoveryMenuData } from "./types";
import { getMenusAction, getDiscoveryAction } from "@/app/(server)/actions/navigation";
import { getClientDictionary } from "@/lib/client-dictionaries";
import {
  megaMenuLoadFailedGenericMessage,
  megaMenuLoadFailedMessage,
} from "@/lib/layout/mega-menu-errors";
import type { Dict } from "@/lib/types";

// ── Skeleton ─────────────────────────────────────────────────────────

function MenuSkeleton({ dict }: { dict: Dict | null }) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 px-3 py-1.5 text-xs">
      <div
        className="bg-muted h-5 w-32 animate-pulse rounded"
        aria-label={dict?.mega_menu?.loading_aria || "Učitavanje menija"}
      />
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

async function loadNavigationData(dict: Dict | null): Promise<{
  menus: NavigationMenuData[];
  discovery: DiscoveryMenuData;
  error: string | null;
}> {
  try {
    const [menuResult, discoveryResult] = await Promise.all([
      getMenusAction(),
      getDiscoveryAction(),
    ]);
    const menus =
      menuResult.success && menuResult.data
        ? (menuResult.data as { menus: NavigationMenuData[] }).menus
        : [];
    const discovery =
      discoveryResult.success && discoveryResult.data
        ? (discoveryResult.data as DiscoveryMenuData)
        : { cities: [], featured: null };
    const error =
      !menuResult.success || !discoveryResult.success
        ? megaMenuLoadFailedMessage(dict)
        : null;
    return { menus, discovery, error };
  } catch (err) {
    console.error("Menu fetch failed:", err);
    return {
      menus: [],
      discovery: { cities: [], featured: null },
      error: megaMenuLoadFailedGenericMessage(dict, err),
    };
  }
}

// ── Main component ──────────────────────────────────────────────────

export function MegaMenu({ side = "left" }: { side?: "left" | "right" }) {
  const [menus, setMenus] = useState<NavigationMenuData[]>([]);
  const [discovery, setDiscovery] = useState<DiscoveryMenuData>({ cities: [], featured: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dict, setDict] = useState<Dict | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const dictRef = useRef<Dict | null>(null);

  useEffect(() => {
    getClientDictionary().then((d) => {
      dictRef.current = d;
      setDict(d);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Async fetch — setState only in promise callbacks (not sync in effect body)
    void loadNavigationData(dictRef.current).then((result) => {
      if (cancelled) return;
      setMenus(result.menus);
      setDiscovery(result.discovery);
      setError(result.error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryToken((n) => n + 1);
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

  const mainNavAria = dict?.mega_menu?.main_nav_aria || "Glavna navigacija";
  const notAvailable = dict?.mega_menu?.not_available || "Meni nije dostupan";
  const retryLabel = dict?.mega_menu?.retry || "Pokušaj ponovo";
  const retryAria = dict?.mega_menu?.retry_aria || "Pokušaj ponovo";

  if (loading) {
    return (
      <nav aria-label={mainNavAria}>
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <MenuSkeleton dict={dict} />
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
    );
  }

  if (error) {
    return (
      <nav aria-label={mainNavAria}>
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <li className="text-muted-foreground flex items-center gap-3 px-3 py-1.5 text-xs">
              <span>{error || notAvailable}</span>
              <Button variant="outline" size="sm" onClick={handleRetry} aria-label={retryAria}>
                <Icon name="refresh" className="size-3" />
                {retryLabel}
              </Button>
            </li>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
    );
  }

  return (
    <nav aria-label={mainNavAria}>
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          {filteredMenus.length === 0 ? (
            <li className="text-muted-foreground flex items-center gap-2 px-3 py-1.5 text-xs">
              {notAvailable}
            </li>
          ) : (
            filteredMenus.map((menu) => (
              <NavigationMenuItem key={menu.id}>
                <NavigationMenuTrigger className="data-[state=open]:text-primary h-11 min-h-11 gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors">
                  <Icon name={menu.icon} className="text-primary/70 size-4" aria-hidden="true" />
                  {menu.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[min(900px,calc(100vw-2rem))] max-w-[900px] min-w-0 p-4 sm:p-6 md:min-w-[min(700px,calc(100vw-4rem))]">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr_1fr]">
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
