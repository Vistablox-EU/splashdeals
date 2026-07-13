"use client";

import React from "react";
import { useUIState } from "@/hooks/use-ui-state";
import { useHeaderScroll, DesktopTopNav } from "./_header";
import { getCartAction } from "@/app/(server)/actions/cart";
import type { Dict } from "@/lib/types";
import type { CartItem } from "@/lib/types/cart";

interface HeaderProps {
  dict: Dict;
  cities: { id: string; name: string; slug: string }[];
}

export const Header = ({ dict: _dict, cities }: HeaderProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [totalItems, setTotalItems] = React.useState(0);
  const openCart = useUIState((state) => state.openCart);

  const { scrolled, isOnline, isTabActive, isReducedMotion, mounted } = useHeaderScroll();

  // 🛒 Fetch cart item count from server on mount
  React.useEffect(() => {
    getCartAction()
      .then((result) => {
        if (result.success && result.data) {
          const items = (result.data.items || []) as CartItem[];
          setTotalItems(items.reduce((sum: number, i: CartItem) => sum + (i.quantity || 0), 0));
        }
      })
      .catch(() => {});
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
