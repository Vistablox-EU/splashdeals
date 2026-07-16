"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useServerCart } from "@/hooks/use-server-cart";
import { getClientDictionary } from "@/lib/client-dictionaries";
import { isAccountBottomNavActive } from "@/lib/auth/account-paths";
import { isBottomNavActive } from "@/lib/layout/bottom-nav-active";
import { isBottomNavAlwaysVisible } from "@/lib/layout/bottom-nav-visibility";
import type { Dict } from "@/lib/types";

const SCROLL_THRESHOLD = 10;

/**
 * 📱 BottomNav — Mobile-only bottom navigation.
 *
 * Always visible on home, cart, product pages, and whenever the cart has items
 * (sticky mini-cart / checkout CTAs stay aligned). Other routes: scroll-hide.
 *
 * Explore → /search (primary mobile search entry; categories stay in MegaMenu).
 * Touch: min 48×48 targets; labels ≥10px for outdoor readability.
 */
export function BottomNav() {
  const pathname = usePathname();
  const totalItems = useServerCart((state) => state.totalItems);
  const alwaysVisible = isBottomNavAlwaysVisible(pathname, totalItems);
  const [scrollHidden, setScrollHidden] = useState(false);
  const [dict, setDict] = useState<Dict | null>(null);
  const lastScrollY = useRef(0);
  // Track path for render-time scroll-hide reset (avoids setState-in-effect)
  const [navPath, setNavPath] = useState(pathname);

  // Reset scroll-hide when the route changes (React-approved render-time adjust)
  if (navPath !== pathname) {
    setNavPath(pathname);
    setScrollHidden(false);
  }

  const isVisible = alwaysVisible || !scrollHidden;

  useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  useEffect(() => {
    if (alwaysVisible) return;

    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY < SCROLL_THRESHOLD) {
        setScrollHidden(false);
      } else if (delta > SCROLL_THRESHOLD) {
        setScrollHidden(true);
      } else if (delta < -SCROLL_THRESHOLD) {
        setScrollHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [alwaysVisible, pathname]);

  const NAV_ITEMS = [
    { label: dict?.nav?.home || "Početna", href: "/", icon: "home", kind: "path" as const },
    {
      label: dict?.nav?.explore || "Istraži",
      href: "/search",
      icon: "explore",
      kind: "path" as const,
    },
    {
      label: dict?.nav?.cart_mobile || "Korpa",
      href: "/cart",
      icon: "shopping_bag",
      kind: "path" as const,
    },
    {
      label: dict?.nav?.account_mobile || dict?.nav?.account || "Nalog",
      href: "/moje-karte",
      icon: "person",
      kind: "account" as const,
    },
    {
      label: dict?.nav?.support_mobile || "Podrška",
      href: "/support",
      icon: "support_agent",
      kind: "path" as const,
    },
  ];

  return (
    <nav
      className="border-border/50 bg-background/98 safe-area-bottom fixed inset-x-0 bottom-0 z-[998] border-t backdrop-blur-[40px] transition-transform duration-300 ease-in-out motion-reduce:transition-none md:hidden"
      style={{ transform: isVisible ? "translateY(0)" : "translateY(100%)" }}
      aria-label={dict?.layout?.mobile_nav_aria || "Mobilna navigacija"}
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.kind === "account"
              ? isAccountBottomNavActive(pathname)
              : isBottomNavActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 transition-colors duration-200 motion-reduce:transition-none ${
                active
                  ? "text-primary"
                  : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30"
              } `}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <div className="relative">
                {item.icon === "shopping_bag" && totalItems > 0 && (
                  <span className="bg-primary text-primary-foreground shadow-primary/30 absolute -top-2 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] leading-none font-black shadow-lg">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
                <Icon
                  name={item.icon}
                  className={`text-[22px] transition-colors duration-200 motion-reduce:transition-none ${
                    active ? "text-primary" : ""
                  }`}
                />
              </div>
              <span
                className={`text-[10px] leading-none font-black tracking-[0.08em] uppercase transition-colors duration-200 motion-reduce:transition-none ${
                  active ? "text-primary" : ""
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
