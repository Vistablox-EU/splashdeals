"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Icon } from "@/components/ui/Icon";

// ── Static page labels ─────────────────────────────────────────────
const STATIC_LABELS: Record<string, string> = {
  "how-it-works": "Kako Funcioniše",
  terms: "Uslovi Korišćenja",
  privacy: "Privatnost",
  support: "Podrška",
  cookies: "Kolačići",
  cart: "Korpa",
  checkout: "Plaćanje",
  search: "Pretraga",
  success: "Uspešna Porudžbina",
  blog: "Blog",
};

// ── Known category slugs → display names ───────────────────────────
const CATEGORY_NAMES: Record<string, string> = {
  "akva-parkovi": "Akva Parkovi",
  bazeni: "Bazeni",
  "wellness-i-spa": "Wellness i Spa",
};

// ── DB values → category slug lookup ───────────────────────────────
const DB_TO_SLUG: Record<string, string> = {
  "akva park": "akva-parkovi",
  bazen: "bazeni",
  "public pool": "bazeni",
  "swimming pool": "bazeni",
  "wellness i spa": "wellness-i-spa",
};

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
  const segments = pathname.split("/").filter(Boolean);

  const trail = useMemo<{ items: BreadcrumbItem[]; backHref?: string }>(() => {
    const items: BreadcrumbItem[] = [{ label: "Početna", href: "/" }];
    let backHref: string | undefined;

    if (segments.length >= 1) {
      const slug = segments[0].toLowerCase();

      if (STATIC_LABELS[slug]) {
        items.push({ label: STATIC_LABELS[slug] });
      } else if (CATEGORY_NAMES[slug]) {
        items.push({ label: CATEGORY_NAMES[slug] });
      } else if (facilityMap[slug]) {
        const fac = facilityMap[slug];
        // Map DB category value → slug → display name
        const catSlug = DB_TO_SLUG[fac.category.toLowerCase()];
        const catName = catSlug ? CATEGORY_NAMES[catSlug] : fac.category;

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
  }, [pathname, facilityMap, segments]);

  const { items, backHref } = trail;
  const isLastItem = (idx: number) => idx === items.length - 1;

  return (
    <div className="w-full border-b border-white/5 bg-background/98 backdrop-blur-[40px] sticky top-16 z-[100]">
      <div className="max-w-7xl mx-auto w-full flex items-center gap-0 px-4 md:px-12 h-10">
        {/* Back button */}
        {backHref && (
          <Link
            href={backHref}
            className="shrink-0 flex items-center justify-center h-full pr-3 text-slate-400 hover:text-white border-r border-white/5 mr-3 transition-colors"
            aria-label="Nazad"
          >
            <Icon name="arrow_back" className="text-[14px]" />
            <span className="sr-only">Nazad</span>
          </Link>
        )}

        {/* Breadcrumb trail */}
        <div className="flex items-center gap-0 overflow-x-auto no-scrollbar w-full">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center">
              {idx > 0 && (
                <Icon name="keyboard_arrow_right" className="text-[12px] text-slate-600 shrink-0 mx-1.5" />
              )}
              {item.href && !isLastItem(idx) ? (
                item.href === "/" ? (
                  <Link
                    href={item.href}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-cyan-400 transition-colors shrink-0 flex items-center gap-1"
                    aria-label={item.label}
                  >
                    <Icon name="home" className="text-[12px]" />
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <Link
                    href={item.href}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
                  >
                    {item.label}
                  </Link>
                )
              ) : (
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 whitespace-nowrap shrink-0">
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
