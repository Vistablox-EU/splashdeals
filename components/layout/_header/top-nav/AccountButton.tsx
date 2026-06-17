"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { LiquidButton } from "@/components/ui/LiquidButton";


interface AccountButtonProps {
  dict: any;
}

export function AccountButton({ dict }: AccountButtonProps) {
  return (
    <LiquidButton variant="ghost" size="sm" className="px-4 h-11 font-medium" aria-label={dict.nav.account || "Moj Nalog"}>
      <Icon name="person" className="text-[16px] text-cyan-500" />
      <span className="hidden lg:inline ml-2">{dict.nav.account || "Moj Nalog"}</span>
    </LiquidButton>
  );
}
