"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import type { Dict } from "@/lib/types";

interface MobileOverlayHeaderProps {
  onClose: () => void;
  dict?: Dict;
}

export function MobileOverlayHeader({ onClose, dict }: MobileOverlayHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="animate-float flex items-center tracking-[-0.1em] select-none">
        <div className="group/logo relative overflow-hidden">
          <span className="text-splash relative z-10 text-2xl font-black uppercase italic md:text-3xl">
            Splash
          </span>
          {/* Glint Overlay */}
          <div className="group-hover/logo:animate-logo-shimmer via-foreground/20 pointer-events-none absolute inset-0 z-20 translate-x-[-100%] skew-x-[-20deg] bg-gradient-to-r from-transparent to-transparent" />
        </div>
        <span className="text-foreground -ml-1 text-3xl font-black uppercase italic md:text-4xl">
          deals
        </span>
        <div className="relative mt-4 ml-1">
          <div className="bg-primary h-2 w-2 animate-pulse rounded-full" />
          <div className="bg-primary absolute inset-0 h-2 w-2 animate-ping rounded-full opacity-50 blur-[2px]" />
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="hover:border-primary/20 active:bg-primary/20 active:border-primary/30 border-border/10 bg-muted/10 text-muted-foreground shadow-foreground/10 flex h-11 w-11 items-center justify-center rounded-xl border shadow-md transition-all duration-300 active:scale-90"
        aria-label={dict?.nav?.close_menu ?? "Zatvori meni"}
      >
        <Icon name="close" className="text-primary text-[20px]" />
      </Button>
    </div>
  );
}
