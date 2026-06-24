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
import { SectionHeading, NavItemLink, MenuDotLink, FooterBadge } from "./sections";
import { ScannerBlock, ClubCardBlock } from "./visual-blocks";
import type { NavigationMenuData, NavigationMenuSectionData, DiscoveryMenuData } from "./types";

// ── Skeleton ────────────────────────────────────────────────────────

function MenuSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
      <div className="h-5 w-32 animate-pulse rounded bg-muted" aria-label="Učitavanje menija" />
    </div>
  );
}

function CitySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-1.5" aria-hidden="true">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-9 rounded-sm bg-muted/50 animate-pulse" />
      ))}
    </div>
  );
}

// ── Section renderer ────────────────────────────────────────────────

function SectionRenderer({
  section,
  menu,
  sortedCities,
  loadingCities,
}: {
  section: NavigationMenuSectionData;
  menu: NavigationMenuData;
  sortedCities: { id: string; name: string; slug: string }[];
  loadingCities: boolean;
}) {
  const config = section.config as Record<string, unknown> | null;

  return (
    <section
      key={section.id}
      aria-labelledby={section.heading ? `nav-h-${section.id}` : undefined}
    >
      {section.style !== "VISUAL" &&
        section.style !== "FOOTER_BADGE" &&
        section.heading && (
          <SectionHeading>
            <span id={`nav-h-${section.id}`}>{section.heading}</span>
          </SectionHeading>
        )}

      <ul className="space-y-2" role="menu" aria-label={section.heading || menu.label}>
        {section.style === "LINKS" &&
          section.items.map((item) => (
            <NavItemLink
              key={item.id}
              href={item.href}
              icon={item.icon}
              title={item.label}
              desc={item.desc}
              metadata={item.metadata}
            />
          ))}

        {section.style === "DOT_LINKS" &&
          section.items.map((item) => (
            <MenuDotLink
              key={item.id}
              href={item.href || "#"}
              label={item.label}
              count={item.metadata?.count}
            />
          ))}

        {section.style === "DYNAMIC_CITIES" && (
          <>
            {loadingCities ? (
              <li><CitySkeleton count={(config?.maxItems as number) || 6} /></li>
            ) : (
              sortedCities
                .slice(0, (config?.maxItems as number) || 10)
                .map((city) => (
                  <MenuDotLink
                    key={city.id}
                    href={`/akva-parkovi?city=${city.slug}`}
                    label={city.name}
                  />
                ))
            )}
            {sortedCities.length > (config?.maxItems as number || 10) && (
              <MenuDotLink
                href="/akva-parkovi"
                label={`+${sortedCities.length - ((config?.maxItems as number) || 10)} gradova`}
              />
            )}
          </>
        )}

        {section.style === "VISUAL" && (
          <li>
            {config?.component === "scanner" && <ScannerBlock />}
            {config?.component === "club_card" && <ClubCardBlock />}
          </li>
        )}

        {section.style === "FOOTER_BADGE" && (
          <li>
            <FooterBadge heading={section.heading} icon={config?.icon as string | undefined} />
          </li>
        )}
      </ul>
    </section>
  );
}

// ── Constants ───────────────────────────────────────────────────────

const POPULAR_CITY_SLUGS = [
  "belgrade", "beograd", "novi-sad", "jagodina",
  "vrnjacka-banja", "subotica",
];

// ── Main component ──────────────────────────────────────────────────

export function MegaMenu() {
  const [menus, setMenus] = useState<NavigationMenuData[]>([]);
  const [discovery, setDiscovery] = useState<DiscoveryMenuData>({ cities: [], featured: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, discoveryRes] = await Promise.all([
          fetch("/api/menu/navigation"),
          fetch("/api/menu/discovery"),
        ]);
        const menuData = await menuRes.json();
        const discoveryData = await discoveryRes.json();
        if (menuData.menus) setMenus(menuData.menus);
        if (discoveryData) setDiscovery(discoveryData);
      } catch (error) {
        console.error("Menu fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  return (
    <nav aria-label="Glavna navigacija">
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          {menus.length === 0 ? (
            <li className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
              Meni nije dostupan
            </li>
          ) : (
            menus.map((menu) => (
              <NavigationMenuItem key={menu.id}>
                <NavigationMenuTrigger className="h-9 px-3 py-1.5 text-xs font-bold uppercase tracking-wider gap-1.5 data-[state=open]:text-primary rounded-xl transition-colors">
                  <Icon name={menu.icon} className="size-4 text-primary/70" aria-hidden="true" />
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
                                loadingCities={false}
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
