"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { getCartAction } from "@/app/(server)/actions/cart";
import type { CartItem } from "@/lib/types/cart";
import { getClientDictionary } from "@/lib/client-dictionaries";
import type { Dict } from "@/lib/types";

const SCROLL_THRESHOLD = 10;

/**
 * 📱 BottomNav — Mobile-only bottom navigation bar with scroll-hide.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [totalItems, setTotalItems] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [dict, setDict] = useState<Dict | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  const NAV_ITEMS = [
    { label: dict?.nav?.home || "Početna", href: "/", icon: "home" },
    { label: dict?.nav?.explore || "Istraži", href: "/akva-parkovi", icon: "explore" },
    { label: dict?.nav?.offers || "Ponude", href: "/#deals", icon: "local_fire_department" },
    { label: dict?.nav?.cart_mobile || "Korpa", href: "/cart", icon: "shopping_bag" },
    { label: dict?.nav?.support_mobile || "Podrška", href: "/support", icon: "support_agent" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY < SCROLL_THRESHOLD) {
        setIsVisible(true);
      } else if (delta > SCROLL_THRESHOLD) {
        setIsVisible(false);
      } else if (delta < -SCROLL_THRESHOLD) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // 🛒 Fetch cart badge count from server
    getCartAction()
      .then((result) => {
        if (result.success && result.data) {
          const items = (result.data.items || []) as CartItem[];
          setTotalItems(items.reduce((sum: number, i: CartItem) => sum + (i.quantity || 0), 0));
        }
      })
      .catch(() => {});

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return pathname === href.split("#")[0];
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="border-border/50 bg-background/98 safe-area-bottom fixed inset-x-0 bottom-0 z-[998] border-t backdrop-blur-[40px] transition-transform duration-300 ease-in-out md:hidden"
      style={{ transform: isVisible ? "translateY(0)" : "translateY(100%)" }}
      aria-label={dict?.layout?.mobile_nav_aria || "Mobilna navigacija"}
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 transition-all duration-200 ${
                active
                  ? "text-primary"
                  : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30"
              } `}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <div className="relative">
                {item.icon === "shopping_bag" && totalItems > 0 && (
                  <span className="bg-primary text-primary-foreground shadow-primary/30 absolute -top-2 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] leading-none font-black shadow-lg">
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
                className={`text-[9px] leading-none font-black tracking-[0.12em] uppercase transition-colors duration-200 ${
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
