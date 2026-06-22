"use client";

import React from "react";
import { useCart, initCartSync } from "@/hooks/use-cart";
import { useUIState } from "@/hooks/use-ui-state";
import { useHeaderScroll, DesktopTopNav } from "./_header";
;

interface HeaderProps {
  cities: { id: string; name: string; slug: string }[];
}

export const Header = ({ cities }: HeaderProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const openCart = useUIState((state) => state.openCart);
  const totalItems = useCart((state) => state.getTotalItems());

  const {
    scrolled,
    isOnline,
    isTabActive,
    isReducedMotion,
    mounted,
  } = useHeaderScroll();

  // Init cart sync on mount
  React.useEffect(() => {
    const cleanup = initCartSync();
    return cleanup;
  }, []);

  return (
    <>
      <header
        className={`
          fixed top-0 inset-x-0 z-[999] border-b transition-all duration-500
          flex flex-col justify-center px-4 md:px-12
          ${
            scrolled
              ? "bg-background/98 backdrop-blur-[40px] border-border/50"
              : "bg-background/95 backdrop-blur-[20px] border-border/30"
          }
        `}
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
        />

        {/* ⚡ Online status dot for tab bar */}
        {isOnline === false && (
          <div className="hidden" role="status" aria-label="offline" />
        )}
      </header>
    </>
  );
};
