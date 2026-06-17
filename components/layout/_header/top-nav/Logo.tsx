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
      href={``}
      className="group flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        "flex items-center tracking-[-0.08em] select-none",
        (isTabActive && !isReducedMotion) ? "animate-float group-hover:[animation-play-state:paused]" : ""
      )}>
        <div className="relative overflow-hidden group/logo">
          <span className="text-2xl md:text-3xl font-black italic uppercase text-splash relative z-10">
            Splash
          </span>
          {/* Glint Overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none translate-x-[-100%] group-hover/logo:animate-logo-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
        </div>

        <div className="relative">
          {/* Water Splash Particles — CSS animated on hover */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
              (isHovered && !isReducedMotion) ? "opacity-100" : "opacity-0"
            }`}
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={`drop-${i}`}
                style={{
                  animation: `logo-particle 0.8s ease-out ${i * 0.01}s forwards`,
                  "--x": `${((i * 37) % 80) - 40}px`,
                  "--y": `${((i * 41) % 70) - 45}px`,
                } as React.CSSProperties}
                className="absolute top-1/2 left-1/2 w-[6px] h-[6px] bg-cyan-400 rounded-full blur-[1px] opacity-0"
              />
            ))}
            {/* Ripple Effect */}
            <div
              style={{ animation: "logo-ripple 0.6s ease-out forwards" }}
              className="absolute inset-0 bg-cyan-400/30 rounded-xl blur-lg opacity-0"
            />
          </div>
        </div>

        <span className="text-2xl md:text-3xl font-black italic uppercase text-white group-hover:text-cyan-50 transition-colors -ml-1">
          deals
        </span>
        <div className="relative ml-1 mt-3">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-cyan-400 blur-[2px] animate-ping opacity-50" />
          <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse delay-75 scale-150 opacity-20 pointer-events-none group-hover:scale-[3] transition-transform duration-500" />
        </div>
      </div>

      {/* CSS keyframes for logo splash particles */}
      <style>{`
        @keyframes logo-particle {
          0% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(var(--x, 0), var(--y, 0)); }
          100% { opacity: 0; transform: scale(0.4) translate(var(--x, 0), var(--y, 0)); }
        }
        @keyframes logo-ripple {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.4; transform: scale(2.5); }
          100% { opacity: 0; transform: scale(2.5); }
        }
      `}</style>
    </Link>
  );
}
