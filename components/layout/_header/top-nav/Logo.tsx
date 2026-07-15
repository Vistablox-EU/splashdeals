"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Dict } from "@/lib/types";

interface LogoProps {
  isTabActive: boolean;
  isReducedMotion: boolean;
  isHovered: boolean;
  setIsHovered: (v: boolean) => void;
  dict?: Dict;
}

export function Logo({ isTabActive, isReducedMotion, isHovered, setIsHovered, dict }: LogoProps) {
  return (
    <Link
      href="/"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex min-h-[44px] items-center gap-2.5 py-1",
        isTabActive && "opacity-100",
      )}
      aria-label={dict?.brand?.logo_aria ?? "Splashdeals početna"}
    >
      {/* Brand Logo Image */}
      <Image
        src="/logo-splashdeals.webp"
        alt={dict?.brand?.logo_alt ?? "SplashDeals - digitalne ulaznice za vodene parkove Srbija"}
        width={331}
        height={112}
        className={cn(
          "h-12 w-auto object-contain",
          "transition-[transform,filter] duration-300",
          isHovered && "scale-105 brightness-110",
          isReducedMotion && "transition-none",
        )}
        priority
      />
    </Link>
  );
}
