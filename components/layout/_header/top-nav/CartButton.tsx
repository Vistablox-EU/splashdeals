"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { cn } from "@/lib/utils";


interface CartButtonProps {
  dict: any;
  isOnline: boolean;
  mounted: boolean;
  totalItems: number;
  openCart: () => void;
}

export function CartButton({ dict, isOnline, mounted, totalItems, openCart }: CartButtonProps) {
  return (
    <div className="relative flex items-center gap-2">
      {/* Offline Indicator — CSS transition on mount/unmount */}
      {!isOnline && (
        <div
          className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 border border-destructive/20 rounded-lg text-[9px] font-black text-destructive uppercase tracking-wider shadow-lg transition-all duration-300"
        >
          <Icon name="cloud_off" className="text-[12px] animate-pulse" />
          {dict.nav.offline || "Nema Mreže"}
        </div>
      )}

      <LiquidButton
        variant="primary"
        size="sm"
        className={cn(
          "px-5 group h-11 transition-all",
          !isOnline && "opacity-50 grayscale cursor-not-allowed"
        )}
        onClick={() => {
          if (!isOnline) return;
          openCart();
          if ("vibrate" in navigator) navigator.vibrate(10);
        }}
        aria-label={isOnline ? `Otvorite korpu - ${totalItems}` : (dict.nav.offline || "Nema Mreže")}
      >
        <div className="relative">
          <Icon name="shopping_bag" className="text-[16px]" />
          {(mounted && totalItems > 0) && (
            <span
              className="absolute -top-3 -right-3 bg-white text-navy-deep text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
            >
              {totalItems}
            </span>
          )}
        </div>
        <span className="hidden sm:inline">{dict.nav.checkout || "Korpa"}</span>
      </LiquidButton>
    </div>
  );
}
