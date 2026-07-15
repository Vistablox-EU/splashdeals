"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

import type { Dict } from "@/lib/types";

interface AccountButtonProps {
  dict: Dict;
}

export function AccountButton({ dict }: AccountButtonProps) {
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;

  const href = isLoggedIn ? "/moje-karte" : "/prijava";
  const label = isLoggedIn ? dict.nav.account || "Moj Nalog" : dict.nav.login || "Prijava";

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="h-11 min-h-11 px-4 font-medium transition-colors"
    >
      <Link href={href} aria-label={label}>
        <Icon name="person" className="text-primary text-[16px]" />
        <span className="ml-2 hidden lg:inline">{label}</span>
      </Link>
    </Button>
  );
}
