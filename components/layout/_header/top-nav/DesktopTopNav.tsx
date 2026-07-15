"use client";

import { MegaMenu } from "../mega-menu/MegaMenu";
import { Logo } from "./Logo";

import { ThemeToggle } from "./ThemeToggle";
import { CartButton } from "./CartButton";
import { AccountButton } from "./AccountButton";
import { SearchBox } from "@/app/(web)/_components/SearchBox";
import type { Dict } from "@/lib/types";

interface DesktopTopNavProps {
  mounted: boolean;
  totalItems: number;
  isOnline: boolean;
  openCart: () => void;
  isTabActive: boolean;
  isReducedMotion: boolean;
  isHovered: boolean;
  setIsHovered: (v: boolean) => void;
  dict: Dict;
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
  dict,
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
            dict={dict}
          />
        </div>

        {/* Right — SearchBox + MegaMenu (right-placed menus) + controls */}
        <div className="flex flex-1 items-center justify-end gap-1.5 md:gap-3">
          <div className="hidden md:block">
            <SearchBox dict={dict as Record<string, any>} />
          </div>
          <MegaMenu side="right" />
          <AccountButton dict={dict} />
          <ThemeToggle dict={dict} />
          <CartButton
            isOnline={isOnline}
            mounted={mounted}
            totalItems={totalItems}
            openCart={openCart}
            dict={dict}
          />
        </div>
      </nav>
    </div>
  );
}
