"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";

import type { Dict } from "@/lib/types";

interface OfflineIndicatorProps {
  isOnline: boolean;
  dict?: Dict | null;
}

export function OfflineIndicator({ isOnline, dict }: OfflineIndicatorProps) {
  if (isOnline) return null;

  return (
    <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[9px] font-black tracking-wider uppercase shadow-lg transition-opacity duration-300">
      <Icon name="cloud_off" className="animate-pulse text-[12px]" />
      {dict?.nav?.offline || "Nema Mreže"}
    </div>
  );
}
