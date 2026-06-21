"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "@/hooks/use-cart";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Početna", href: "/", icon: "home" },
  { label: "Istraži", href: "/akva-parkovi", icon: "explore" },
  { label: "Ponude", href: "/#deals", icon: "local_fire_department" },
  { label: "Korpa", href: "/cart", icon: "shopping_bag" },
  { label: "Podrška", href: "/support", icon: "support_agent" },
] as const;

const SCROLL_THRESHOLD = 10;

/**
 * 📱 BottomNav — Mobile-only bottom navigation bar with scroll-hide.
 * Shows while scrolling up, hides after scrolling down past a threshold.
 * Always visible when near the top of the page.
 */
export function BottomNav() {
  const pathname = usePathname();
  const totalItems = useCart((s) => s.getTotalItems());
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      // Always visible near the top
      if (currentScrollY < SCROLL_THRESHOLD) {
        setIsVisible(true);
      } else if (delta > SCROLL_THRESHOLD) {
        // Scrolling down past threshold → hide
        setIsVisible(false);
      } else if (delta < -SCROLL_THRESHOLD) {
        // Scrolling up past threshold → show
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return pathname === href.split("#")[0];
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[998] md:hidden border-t border-border/50 bg-background/98 backdrop-blur-[40px] safe-area-bottom transition-transform duration-300 ease-in-out"
      style={{ transform: isVisible ? "translateY(0)" : "translateY(100%)" }}
      aria-label="Mobilna navigacija"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center justify-center gap-0.5
                min-w-[56px] min-h-[44px] rounded-xl px-2 py-1
                transition-all duration-200
                ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30"
                }
              `}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <div className="relative">
                {item.icon === "shopping_bag" && totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground leading-none px-1 shadow-lg shadow-primary/30">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
                <Icon
                  name={item.icon}
                  className={`text-[22px] transition-colors duration-200 ${
                    active ? "text-primary" : ""
                  }`}
                />
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-[0.12em] leading-none transition-colors duration-200 ${
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
