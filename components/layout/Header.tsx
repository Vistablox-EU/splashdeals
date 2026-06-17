"use client";

import React, { useState } from "react";
import { useCart, initCartSync } from "@/hooks/use-cart";
import { useUIState } from "@/hooks/use-ui-state";
import { useBreadcrumb } from "@/hooks/use-breadcrumb";
import { useHeaderScroll, DesktopTopNav, Breadcrumb, MobileOverlay } from "./_header";

interface HeaderProps {
  dict: any;
  cities: { id: string; name: string; slug: string }[];
}

export const Header = ({ dict, cities }: HeaderProps) => {
  const { items: breadcrumbItems, backHref } = useBreadcrumb();
  const hasBreadcrumbs = breadcrumbItems.length > 0;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const openCart = useUIState((state) => state.openCart);
  const totalItems = useCart((state) => state.getTotalItems());

  const {
    scrolled,
    isOnline,
    isTabActive,
    isReducedMotion,
    mounted,
  } = useHeaderScroll();

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

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
              ? "bg-[rgba(2,6,23,0.98)] backdrop-blur-[40px] border-white/[0.12]"
              : "bg-[rgba(2,6,23,0.95)] backdrop-blur-[20px] border-white/[0.08]"
          }
        `}
      >
        <DesktopTopNav
          dict={dict}
          cities={cities}
          mounted={mounted}
          totalItems={totalItems}
          isOnline={isOnline}
          openCart={openCart}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          isTabActive={isTabActive}
          isReducedMotion={isReducedMotion}
          isHovered={isHovered}
          setIsHovered={setIsHovered}
        />

        <Breadcrumb
          breadcrumbItems={breadcrumbItems}
          backHref={backHref}
          hasBreadcrumbs={hasBreadcrumbs}
        />
      </header>

      <MobileOverlay
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        dict={dict}
        cities={cities}
        isReducedMotion={isReducedMotion}
        isTabActive={isTabActive}
      />
    </>
  );
};
