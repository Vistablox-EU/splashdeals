"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useServerCart } from "@/hooks/use-server-cart";
import { isAccountBottomNavActive } from "@/lib/auth/account-paths";
import { isBottomNavActive } from "@/lib/layout/bottom-nav-active";
import { isBottomNavAlwaysVisible } from "@/lib/layout/bottom-nav-visibility";
import { authClient } from "@/lib/auth-client";
import type { Dict } from "@/lib/types";

const SCROLL_THRESHOLD = 10;

type BottomNavItem = {
  label: string;
  href: string;
  icon: string;
  kind: "path" | "account" | "cart";
};

/**
 * 📱 BottomNav — Mobile-only bottom navigation (4 tabs).
 *
 * Početna · Istraži (/akva-parkovi, indexable hub) · Korpa · Nalog/Prijava
 * Podrška lives in footer (not a 5th tab — density + crawl graph).
 *
 * Always visible on home, cart, product pages, and whenever the cart has items.
 * Other routes: scroll-hide.
 *
 * Dict is server-passed from PlatformShell (no client dictionary fetch).
 */
export function BottomNav({ dict }: { dict?: Dict | null }) {
  const pathname = usePathname();
  const totalItems = useServerCart((state) => state.totalItems);
  const alwaysVisible = isBottomNavAlwaysVisible(pathname, totalItems);
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;
  const [scrollHidden, setScrollHidden] = useState(false);
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

  const NAV_ITEMS: BottomNavItem[] = [
    {
      label: dict?.nav?.home || "Početna",
      href: "/",
      icon: "home",
      kind: "path",
    },
    {
      // SEO: indexable category hub — not noindex /search
      label: dict?.nav?.explore || dict?.nav?.waterparks || "Istraži",
      href: "/akva-parkovi",
      icon: "explore",
      kind: "path",
    },
    {
      label: dict?.nav?.cart_mobile || "Korpa",
      href: "/cart",
      icon: "shopping_bag",
      kind: "cart",
    },
    {
      label: isLoggedIn
        ? dict?.nav?.account_mobile || dict?.nav?.account || "Nalog"
        : dict?.nav?.login || "Prijava",
      href: isLoggedIn ? "/moje-karte" : "/prijava",
      icon: "person",
      kind: "account",
    },
  ];

  return (
    <nav
      className="border-primary/15 bg-background/98 safe-area-bottom fixed inset-x-0 bottom-0 z-[998] border-t backdrop-blur-[40px] transition-transform duration-300 ease-in-out motion-reduce:transition-none md:hidden"
      style={{ transform: isVisible ? "translateY(0)" : "translateY(100%)" }}
      aria-label={dict?.layout?.mobile_nav_aria || "Mobilna navigacija"}
    >
      {/* Teal brand hairline */}
      <div
        aria-hidden
        className="from-primary/0 via-primary/40 to-primary/0 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r"
      />
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around gap-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const active =
            item.kind === "account"
              ? isAccountBottomNavActive(pathname)
              : isBottomNavActive(pathname, item.href);

          const cartAria =
            item.kind === "cart" && totalItems > 0
              ? `${item.label}, ${totalItems > 99 ? "99+" : totalItems} stavki`
              : item.label;

          return (
            <Link
              key={`${item.kind}-${item.href}`}
              href={item.href}
              className={`relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 py-1.5 transition-colors duration-200 motion-reduce:transition-none ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground/65 hover:text-muted-foreground hover:bg-muted/40"
              } `}
              aria-label={cartAria}
              aria-current={active ? "page" : undefined}
            >
              {/* Active top indicator (brand) */}
              {active && (
                <span
                  aria-hidden
                  className="bg-primary absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full"
                />
              )}
              <div className="relative">
                {item.kind === "cart" && totalItems > 0 && (
                  <span
                    className="bg-primary text-primary-foreground shadow-primary/30 absolute -top-2 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] leading-none font-black shadow-lg"
                    aria-hidden
                  >
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
                className={`max-w-full truncate text-[10px] leading-none font-black tracking-[0.06em] uppercase transition-colors duration-200 motion-reduce:transition-none ${
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
