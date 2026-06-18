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
      className="md:hidden flex h-11 w-11 items-center justify-center rounded-xl bg-muted/50 border border-border text-muted-foreground active:scale-90 hover:bg-muted hover:border-primary/20 active:bg-primary/20 active:border-primary/30 transition-all duration-300 shadow-md shadow-black/10 relative overflow-hidden"
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
