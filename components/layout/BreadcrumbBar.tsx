"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { getClientDictionary } from "@/lib/client-dictionaries";
import type { Dict } from "@/lib/types";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface FacilityMap {
  [slug: string]: {
    name: string;
    category: string; // DB category value (e.g. "Akva Park")
  };
}

/**
 * 🧭 BreadcrumbBar
 * Derives breadcrumb trail from the current URL pathname.
 * Uses an embedded facility map (pre-fetched by the server) for facility lookups.
 */
export function BreadcrumbBar({ facilityMap = {} }: { facilityMap?: FacilityMap }) {
  const pathname = usePathname();
  const [dict, setDict] = useState<Dict | null>(null);

  useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  // Static page labels derived from dict
  const STATIC_LABELS = useMemo(() => {
    const bc = dict?.breadcrumb;
    if (!bc) return null;
    return {
      "how-it-works": bc.how_it_works || "Kako Funkcioniše",
      terms: bc.terms || "Uslovi Korišćenja",
      privacy: bc.privacy || "Privatnost",
      support: bc.support || "Podrška",
      cookies: bc.cookies || "Kolačići",
      cart: bc.cart || "Korpa",
      checkout: bc.checkout || "Plaćanje",
      search: bc.search || "Pretraga",
      success: bc.success || "Uspešna Porudžbina",
      blog: bc.blog || "Blog",
    } as Record<string, string>;
  }, [dict]);

  // Category names derived from dict
  const CATEGORY_NAMES = useMemo(() => {
    const cats = dict?.breadcrumb?.categories;
    if (!cats) return null;
    return {
      "akva-parkovi": cats.akva_parkovi || "Akva Parkovi",
      "termalne-rivijere": cats.termalne_rivijere || "Termalne Rivijere",
      bazeni: cats.bazeni || "Bazeni",
      banje: cats.banje || "Banje",
      "wellness-i-spa": cats.wellness_i_spa || "Wellness i Spa",
      jezera: cats.jezera || "Jezera",
      "plaze-i-kupalista": cats.plaze_i_kupalista || "Plaže i Kupališta",
      "vodeni-sportovi": cats.vodeni_sportovi || "Vodeni Sportovi",
    } as Record<string, string>;
  }, [dict]);

  const trail = useMemo<{ items: BreadcrumbItem[]; backHref?: string }>(() => {
    const segments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [{ label: dict?.breadcrumb?.home || "Početna", href: "/" }];
    let backHref: string | undefined;

    if (segments.length >= 1) {
      const slug = segments[0].toLowerCase();

      if (STATIC_LABELS?.[slug]) {
        items.push({ label: STATIC_LABELS[slug] });
      } else if (CATEGORY_NAMES?.[slug]) {
        items.push({ label: CATEGORY_NAMES[slug] });
      } else if (facilityMap[slug]) {
        const fac = facilityMap[slug];
        // Map DB category value → slug → display name
        const dbLower = fac.category.toLowerCase();
        const DB_TO_SLUG: Record<string, string> = {
          "akva park": "akva-parkovi",
          "termalna rivijera": "termalne-rivijere",
          bazen: "bazeni",
          "otvoreni bazen": "bazeni",
          "zatvoreni bazen": "bazeni",
          "javni bazen": "bazeni",
          banja: "banje",
          "wellness i spa": "wellness-i-spa",
          jezero: "jezera",
          "gradska plaza": "plaze-i-kupalista",
          kupaliste: "plaze-i-kupalista",
          reka: "plaze-i-kupalista",
          "vodeni sport": "vodeni-sportovi",
          rafting: "vodeni-sportovi",
        };
        const catSlug = DB_TO_SLUG[dbLower];
        const catName = catSlug && CATEGORY_NAMES ? CATEGORY_NAMES[catSlug] : fac.category;

        if (catSlug) {
          items.push({ label: catName, href: `/${catSlug}` });
        } else {
          items.push({ label: catName });
        }
        items.push({ label: fac.name });
        backHref = catSlug ? `/${catSlug}` : "/";
      }
    }

    return { items, backHref };
  }, [pathname, facilityMap, dict, STATIC_LABELS, CATEGORY_NAMES]);

  const { items, backHref } = trail;
  const isLastItem = (idx: number) => idx === items.length - 1;

  return (
    <div className="bg-background/98 sticky top-16 z-[100] w-full border-b border-border/40 backdrop-blur-[40px]">
      <div className="mx-auto flex h-10 w-full max-w-7xl items-center gap-0 px-4 md:px-12">
        {/* Back button */}
        {backHref && (
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground mr-3 flex h-11 min-w-11 shrink-0 items-center justify-center border-r border-border/40 pr-3 transition-colors"
            aria-label={dict?.breadcrumb?.back_aria || "Nazad"}
          >
            <Icon name="arrow_back" className="text-[16px]" />
            <span className="sr-only">{dict?.breadcrumb?.back_aria || "Nazad"}</span>
          </Link>
        )}

        {/* Breadcrumb trail */}
        <div className="no-scrollbar flex w-full items-center gap-0 overflow-x-auto">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center">
              {idx > 0 && (
                <Icon
                  name="keyboard_arrow_right"
                  className="text-muted-foreground mx-1.5 shrink-0 text-[12px]"
                />
              )}
              {item.href && !isLastItem(idx) ? (
                item.href === "/" ? (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-primary flex shrink-0 items-center gap-1 text-[10px] font-bold tracking-wider uppercase transition-colors"
                    aria-label={item.label}
                  >
                    <Icon name="home" className="text-[12px]" />
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-primary shrink-0 text-[10px] font-bold tracking-wider whitespace-nowrap uppercase transition-colors"
                  >
                    {item.label}
                  </Link>
                )
              ) : (
                <span className="text-primary shrink-0 text-[10px] font-black tracking-wider whitespace-nowrap uppercase">
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
