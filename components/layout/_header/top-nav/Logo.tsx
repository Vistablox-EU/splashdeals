"use client";

import React from "react";
import Link from "next/link";
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
        "flex items-center gap-2.5 group relative",
        isTabActive && "opacity-100"
      )}
      aria-label="Splashdeals početna"
    >
      {/* Icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-[10px] flex items-center justify-center transition-all duration-300",
          "bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/25",
          "group-hover:shadow-cyan-500/40 group-hover:scale-105",
          isReducedMotion && "transition-none"
        )}
      >
        <span className="text-sm font-black text-white leading-none">S</span>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "text-lg font-black tracking-tight uppercase",
            "bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent",
            "transition-all duration-300",
            isHovered && "from-cyan-400 to-cyan-300",
            isReducedMotion && "transition-none"
          )}
        >
          Splash
        </span>
        <span
          className={cn(
            "text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground",
            "transition-colors duration-300",
            isHovered && "text-primary/70",
            isReducedMotion && "transition-none"
          )}
        >
          Deals
        </span>
      </div>
    </Link>
  );
}
