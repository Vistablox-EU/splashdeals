"use client";

import React from "react";
import { useCart, initCartSync } from "@/hooks/use-cart";
import { useUIState } from "@/hooks/use-ui-state";
import { useHeaderScroll, DesktopTopNav } from "./_header";
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
