"use client";

import React from "react";
import { useUIState } from "@/hooks/use-ui-state";
import { useHeaderScroll, DesktopTopNav } from "./_header";
import { useServerCart } from "@/hooks/use-server-cart";
import type { Dict } from "@/lib/types";

interface HeaderProps {
  dict: Dict;
}

/**
 * Fixed site header (z-[999]).
 * Stacking contract with BottomNav (z-[998]) and facility sticky mini-cart (z-[999]).
 */
export const Header = ({ dict }: HeaderProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const totalItems = useServerCart((state) => state.totalItems);
  const openCart = useUIState((state) => state.openCart);

  const { scrolled, isOnline, isTabActive, isReducedMotion, mounted } = useHeaderScroll();

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[999] flex flex-col justify-center border-b px-4 transition-[background-color,border-color,backdrop-filter] duration-500 md:px-12 ${
          scrolled
            ? "bg-background/98 border-border/50 backdrop-blur-[40px]"
            : "bg-background/95 border-border/30 backdrop-blur-[20px]"
        } `}
      >
        <DesktopTopNav
          mounted={mounted}
          totalItems={totalItems}
          isOnline={isOnline}
          openCart={openCart}
          isTabActive={isTabActive}
          isReducedMotion={isReducedMotion}
          isHovered={isHovered}
          setIsHovered={setIsHovered}
          dict={dict}
        />

        {isOnline === false && <div className="hidden" role="status" aria-label="offline" />}
      </header>
    </>
  );
};
