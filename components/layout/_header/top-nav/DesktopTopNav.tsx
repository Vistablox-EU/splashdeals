"use client";

import React from "react";
import Link from "next/link";
import { MegaMenu } from "../mega-menu/MegaMenu";
import { Logo } from "./Logo";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "./ThemeToggle";
import { CartButton } from "./CartButton";
import { AccountButton } from "./AccountButton";
import { authClient } from "@/lib/auth-client";

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
  dict: Record<string, unknown>;
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
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;

  return (
    <div className="flex h-16 w-full items-center">
      <nav className="relative mx-auto flex w-full max-w-7xl items-center justify-between">
        {/* Left — MegaMenu (left-placed menus) */}
        <div className="flex flex-1 justify-start">
          <MegaMenu side="left" />
        </div>

        {/* Center — Logo + mobile account icon */}
        <div className="absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
          <Logo
            isTabActive={isTabActive}
            isReducedMotion={isReducedMotion}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
          />
          {/* 📱 Mobile account icon — right next to the logo */}
          <Link
            href={isLoggedIn ? "/moje-karte" : "/prijava"}
            className="md:hidden"
            aria-label={isLoggedIn ? "Moj nalog" : "Prijava"}
          >
            <Icon name="person" className="text-primary text-[20px]" />
          </Link>
        </div>

        {/* Right — MegaMenu (right-placed menus) + controls */}
        <div className="flex flex-1 items-center justify-end gap-1.5 md:gap-3">
          <MegaMenu side="right" />
          {/* Desktop account — hidden on mobile (moved next to logo) */}
          <div className="hidden md:block">
            <AccountButton dict={dict} />
          </div>
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
