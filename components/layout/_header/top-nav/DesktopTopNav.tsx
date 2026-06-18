"use client";

import React from "react";
import { MegaMenu } from "../mega-menu/MegaMenu";
import { Logo } from "./Logo";

import { ThemeToggle } from "./ThemeToggle";
import { CartButton } from "./CartButton";
import { MobileTopNav } from "./MobileTopNav";


interface DesktopTopNavProps {
  dict: any;
  cities: { id: string; name: string; slug: string }[];
  mounted: boolean;
  totalItems: number;
  isOnline: boolean;
  openCart: () => void;
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  isTabActive: boolean;
  isReducedMotion: boolean;
  isHovered: boolean;
  setIsHovered: (v: boolean) => void;
}

export function DesktopTopNav({
  dict,
  mounted,
  totalItems,
  isOnline,
  openCart,
  onMobileMenuToggle,
  isMobileMenuOpen,
  isTabActive,
  isReducedMotion,
  isHovered,
  setIsHovered,
}: DesktopTopNavProps) {
  return (
    <div className="h-16 flex items-center w-full">
      <nav className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <Logo
          isTabActive={isTabActive}
          isReducedMotion={isReducedMotion}
          isHovered={isHovered}
          setIsHovered={setIsHovered}
        />

        <React.Suspense fallback={<DesktopNavSkeleton />}>
          <MegaMenu dict={dict} />
        </React.Suspense>

        <div className="flex items-center gap-1.5 md:gap-3">
          <ThemeToggle />
          <CartButton
            dict={dict}
            isOnline={isOnline}
            mounted={mounted}
            totalItems={totalItems}
            openCart={openCart}
          />
          <MobileTopNav
            isMobileMenuOpen={isMobileMenuOpen}
            onToggle={onMobileMenuToggle}
          />
        </div>
      </nav>
    </div>
  );
}

const DesktopNavSkeleton = () => (
  <div className="hidden md:flex items-center bg-white/[0.03] border border-white/10 rounded-full h-12 w-32 animate-pulse" />
);
