"use client";

import React from "react";
import { MegaMenu } from "../mega-menu/MegaMenu";
import { Logo } from "./Logo";

import { ThemeToggle } from "./ThemeToggle";
import { CartButton } from "./CartButton";


interface DesktopTopNavProps {
  cities: { id: string; name: string; slug: string }[];
  mounted: boolean;
  totalItems: number;
  isOnline: boolean;
  openCart: () => void;
  isTabActive: boolean;
  isReducedMotion: boolean;
  isHovered: boolean;
  setIsHovered: (v: boolean) => void;
}

export function DesktopTopNav({
  mounted,
  totalItems,
  isOnline,
  openCart,
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
          <MegaMenu />
        </React.Suspense>

        <div className="flex items-center gap-1.5 md:gap-3">
          <ThemeToggle />
          <div className="hidden md:flex">
          <CartButton
            isOnline={isOnline}
            mounted={mounted}
            totalItems={totalItems}
            openCart={openCart}
          />
          </div>
        </div>
      </nav>
    </div>
  );
}

const DesktopNavSkeleton = () => (
  <div className="hidden md:flex items-center bg-muted/30 border border-border/50 rounded-full h-12 w-32 animate-pulse" />
);
