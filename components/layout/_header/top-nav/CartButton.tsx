"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { OfflineIndicator } from "./OfflineIndicator";
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
  // Mobile uses BottomNav → /cart as the only cart entry. Desktop keeps the drawer trigger.
  // Empty cart still shows the control so desktop users can open the empty drawer.
  const label = dict?.nav?.checkout ?? "Korpa";
  const aria =
    mounted && totalItems > 0 ? `${label} - ${totalItems}` : label;

  return (
    <div className="relative hidden items-center gap-2 md:flex">
      <OfflineIndicator isOnline={isOnline} dict={dict} />

      <Button
        variant={totalItems > 0 ? "default" : "ghost"}
        size="sm"
        className={cn(
          "group h-11 min-h-11 gap-2 px-4 font-medium transition-colors",
          !isOnline && "cursor-not-allowed opacity-50 grayscale",
          !mounted && "opacity-70",
        )}
        onClick={() => {
          if (!isOnline) return;
          openCart();
          if ("vibrate" in navigator) navigator.vibrate(10);
        }}
        disabled={!mounted || !isOnline}
        aria-label={aria}
      >
        <div className="relative">
          <Icon name="shopping_bag" className="text-[16px]" />
          {mounted && totalItems > 0 && (
            <span className="bg-primary-foreground text-primary absolute -top-3 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-black shadow-sm transition-opacity duration-300">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </div>
        <span className="hidden sm:inline">{label}</span>
      </Button>
    </div>
  );
}
