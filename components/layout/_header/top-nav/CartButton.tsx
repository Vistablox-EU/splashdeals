"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { cn } from "@/lib/utils";
import type { Dict } from "@/lib/types";

interface CartButtonProps {
  isOnline: boolean;
  mounted: boolean;
  totalItems: number;
  openCart: () => void;
  dict?: Dict;
}

export function CartButton({ isOnline, mounted, totalItems, openCart, dict }: CartButtonProps) {
  return (
    <div className="relative flex items-center gap-2">
      {/* Offline Indicator — CSS transition on mount/unmount */}
      {!isOnline && (
        <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[9px] font-black tracking-wider uppercase shadow-lg transition-all duration-300">
          <Icon name="cloud_off" className="animate-pulse text-[12px]" />
          {dict?.nav?.offline ?? "Nema Mreže"}
        </div>
      )}

      {mounted && totalItems > 0 ? (
        <LiquidButton
          variant="primary"
          size="sm"
          className={cn(
            "group h-11 px-5 transition-all",
            !isOnline && "cursor-not-allowed opacity-50 grayscale",
          )}
          onClick={() => {
            if (!isOnline) return;
            openCart();
            if ("vibrate" in navigator) navigator.vibrate(10);
          }}
          aria-label={`${dict?.nav?.checkout ?? "Korpa"} - ${totalItems}`}
        >
          <div className="relative">
            <Icon name="shopping_bag" className="text-[16px]" />
            <span className="text-background bg-background absolute -top-3 -right-3 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-black shadow-lg transition-all duration-300">
              {totalItems}
            </span>
          </div>
          <span className="hidden sm:inline">{dict?.nav?.checkout ?? "Korpa"}</span>
        </LiquidButton>
      ) : (
        <div className="invisible h-11 w-[106px]" />
      )}
    </div>
  );
}
