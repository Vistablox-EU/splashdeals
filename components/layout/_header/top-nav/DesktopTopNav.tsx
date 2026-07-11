"use client";

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
    <div className="flex h-16 w-full items-center">
      <nav className="relative mx-auto flex w-full max-w-7xl items-center justify-between">
        {/* Left — MegaMenu (left-placed menus) */}
        <div className="flex flex-1 justify-start">
          <MegaMenu side="left" />
        </div>

        {/* Center — Logo */}
        <div className="absolute left-1/2 z-10 -translate-x-1/2">
          <Logo
            isTabActive={isTabActive}
            isReducedMotion={isReducedMotion}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
          />
        </div>

        {/* Right — MegaMenu (right-placed menus) + controls */}
        <div className="flex flex-1 items-center justify-end gap-1.5 md:gap-3">
          <MegaMenu side="right" />
          <ThemeToggle />
          <CartButton
            isOnline={isOnline}
            mounted={mounted}
            totalItems={totalItems}
            openCart={openCart}
          />
        </div>
      </nav>
    </div>
  );
}
