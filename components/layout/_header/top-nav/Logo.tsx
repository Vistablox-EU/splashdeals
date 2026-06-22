"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  isTabActive: boolean;
  isReducedMotion: boolean;
  isHovered: boolean;
  setIsHovered: (v: boolean) => void;
}

export function Logo({ isTabActive, isReducedMotion, isHovered, setIsHovered }: LogoProps) {
  return (
    <Link
      href="/"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "flex items-center gap-2.5 group relative min-h-[44px] py-1",
        isTabActive && "opacity-100"
      )}
      aria-label="Splashdeals početna"
    >
      {/* Brand Logo Image */}
      <Image
        src="/logo-splashdeals.webp"
        alt="SplashDeals - digitalne ulaznice za vodene parkove Srbija"
        width={331}
        height={112}
        className={cn(
          "h-9 sm:h-12 w-auto object-contain",
          "transition-all duration-300",
          isHovered && "scale-105 brightness-110",
          isReducedMotion && "transition-none"
        )}
        priority
      />
    </Link>
  );
}
