"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";

interface MobileTopNavProps {
  isMobileMenuOpen: boolean;
  onToggle: () => void;
}

export function MobileTopNav({ isMobileMenuOpen, onToggle }: MobileTopNavProps) {
  return (
    <button
      onClick={onToggle}
      className="md:hidden flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 text-white/80 active:scale-90 hover:bg-white/10 hover:border-primary/20 active:bg-primary/20 active:border-primary/30 transition-all duration-300 shadow-md shadow-black/10 relative overflow-hidden"
      aria-label={isMobileMenuOpen ? "Zatvori meni" : "Otvori meni"}
    >
      {isMobileMenuOpen ? (
        <Icon name="close" className="text-[20px] text-primary" />
      ) : (
        <Icon name="menu" className="text-[20px] text-primary" />
      )}
    </button>
  );
}
