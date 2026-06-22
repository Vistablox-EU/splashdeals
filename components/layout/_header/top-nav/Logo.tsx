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
        alt="SplashDeals"
        width={132}
        height={40}
        className={cn(
          "h-7 sm:h-10 w-auto object-contain",
          "transition-all duration-300",
          isHovered && "scale-105 brightness-110",
          isReducedMotion && "transition-none"
        )}
        priority
      />
    </Link>
  );
}
