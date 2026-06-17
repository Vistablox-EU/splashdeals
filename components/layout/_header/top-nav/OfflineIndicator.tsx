"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";


interface OfflineIndicatorProps {
  isOnline: boolean;
  dict: any;
}

export function OfflineIndicator({ isOnline, dict }: OfflineIndicatorProps) {
  return (
    <>
      {!isOnline && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 border border-destructive/20 rounded-lg text-[9px] font-black text-destructive uppercase tracking-wider shadow-lg transition-all duration-300">
          <Icon name="cloud_off" className="text-[12px] animate-pulse" />
          {dict.nav.offline || "Nema Mreže"}
        </div>
      )}
    </>
  );
}
