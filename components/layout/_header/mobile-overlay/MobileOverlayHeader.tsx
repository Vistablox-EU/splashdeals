"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";

interface MobileOverlayHeaderProps {
  onClose: () => void;
}

export function MobileOverlayHeader({ onClose }: MobileOverlayHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center tracking-[-0.1em] select-none animate-float">
        <div className="relative overflow-hidden group/logo">
          <span className="text-2xl md:text-3xl font-black italic uppercase text-splash relative z-10">
            Splash
          </span>
          {/* Glint Overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none translate-x-[-100%] group-hover/logo:animate-logo-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
        </div>
        <span className="text-3xl md:text-4xl font-black italic uppercase text-white -ml-1">
          deals
        </span>
        <div className="relative ml-1 mt-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary blur-[2px] animate-ping opacity-50" />
        </div>
      </div>
      <button
        onClick={onClose}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 text-white/80 active:scale-90 hover:bg-white/10 hover:border-primary/20 active:bg-primary/20 active:border-primary/30 transition-all duration-300 shadow-md shadow-black/10"
        aria-label="Zatvori meni"
      >
        <Icon name="close" className="text-[20px] text-primary" />
      </button>
    </div>
  );
}
