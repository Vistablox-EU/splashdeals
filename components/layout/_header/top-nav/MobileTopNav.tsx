"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

interface MobileTopNavProps {
  isMobileMenuOpen: boolean;
  onToggle: () => void;
}

export function MobileTopNav({ isMobileMenuOpen, onToggle }: MobileTopNavProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:border-primary/20 active:bg-primary/20 active:border-primary/30 relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border shadow-md shadow-foreground/10 transition-all duration-300 active:scale-90 md:hidden"
      aria-label={isMobileMenuOpen ? "Zatvori meni" : "Otvori meni"}
    >
      {isMobileMenuOpen ? (
        <Icon name="close" className="text-primary text-[20px]" />
      ) : (
        <Icon name="menu" className="text-primary text-[20px]" />
      )}
    </Button>
  );
}
