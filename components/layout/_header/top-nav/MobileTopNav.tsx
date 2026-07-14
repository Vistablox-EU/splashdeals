"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import type { Dict } from "@/lib/types";

interface MobileTopNavProps {
  isMobileMenuOpen: boolean;
  onToggle: () => void;
  dict?: Dict;
}

export function MobileTopNav({ isMobileMenuOpen, onToggle, dict }: MobileTopNavProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:border-primary/20 active:bg-primary/20 active:border-primary/30 shadow-foreground/10 relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border shadow-md transition-all duration-300 active:scale-90 md:hidden"
      aria-label={
        isMobileMenuOpen
          ? (dict?.nav?.close_menu ?? "Zatvori meni")
          : (dict?.nav?.open_menu ?? "Otvori meni")
      }
    >
      {isMobileMenuOpen ? (
        <Icon name="close" className="text-primary text-[20px]" />
      ) : (
        <Icon name="menu" className="text-primary text-[20px]" />
      )}
    </Button>
  );
}
