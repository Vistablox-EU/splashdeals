"use client";

import React from "react";
import { useCart, initCartSync } from "@/hooks/use-cart";
import { useUIState } from "@/hooks/use-ui-state";
import { useHeaderScroll, DesktopTopNav } from "./_header";
import { getCartAction } from "@/app/(server)/actions/cart";
import type { Dict } from "@/lib/types";

interface HeaderProps {
  dict: Dict;
  cities: { id: string; name: string; slug: string }[];
}

export const Header = ({ dict: _dict, cities }: HeaderProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const openCart = useUIState((state) => state.openCart);
  const totalItems = useCart((state) => state.getTotalItems());

  const { scrolled, isOnline, isTabActive, isReducedMotion, mounted } = useHeaderScroll();

  // Init cart sync on mount
  React.useEffect(() => {
    const cleanup = initCartSync();

    // 🚩 Phase 2: Sync cart badge count with server on mount
    if (process.env.NEXT_PUBLIC_CART_V2) {
      getCartAction()
        .then((result) => {
          if (result.success && result.data) {
            const serverItems = result.data.items || [];
            const currentCount = useCart.getState().getTotalItems();
            const serverCount = serverItems.reduce(
              (sum: number, i: any) => sum + (i.quantity || 0),
              0,
            );
            if (currentCount !== serverCount) {
              // Server has different count — update Zustand to match
              if (serverItems.length === 0) {
                useCart.getState().clearCart();
              } else if (currentCount === 0 && serverCount > 0) {
                // Zustand is empty but server has items — hydrate
                for (const item of serverItems) {
                  useCart.setState((state) => {
                    if (state.items.find((i) => i.id === item.id)) return state;
                    return { items: [...state.items, { ...item, updatedAt: Date.now() }] };
                  });
                }
              }
            }
          }
        })
        .catch(() => {
          // Silently ignore server errors — Zustand is the fallback
        });
    }

    return cleanup;
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[999] flex flex-col justify-center border-b px-4 transition-all duration-500 md:px-12 ${
          scrolled
            ? "bg-background/98 border-border/50 backdrop-blur-[40px]"
            : "bg-background/95 border-border/30 backdrop-blur-[20px]"
        } `}
      >
        <DesktopTopNav
          cities={cities}
          mounted={mounted}
          totalItems={totalItems}
          isOnline={isOnline}
          openCart={openCart}
          isTabActive={isTabActive}
          isReducedMotion={isReducedMotion}
          isHovered={isHovered}
          setIsHovered={setIsHovered}
          dict={_dict}
        />

        {/* ⚡ Online status dot for tab bar */}
        {isOnline === false && <div className="hidden" role="status" aria-label="offline" />}
      </header>
    </>
  );
};
