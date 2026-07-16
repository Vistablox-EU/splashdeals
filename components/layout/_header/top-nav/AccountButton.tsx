"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import type { Dict } from "@/lib/types";

interface AccountButtonProps {
  dict: Dict;
}

function initials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }
  return (email?.[0] || "?").toUpperCase();
}

export function AccountButton({ dict }: AccountButtonProps) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const t = dict.account as Record<string, string> | undefined;
  const isLoggedIn = !!session?.user;

  if (isPending) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="hidden h-11 min-h-11 px-4 font-medium md:inline-flex"
        disabled
        aria-label={dict.nav.account || "Nalog"}
      >
        <Icon name="person" className="text-primary text-[16px]" />
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="hidden h-11 min-h-11 px-4 font-medium transition-colors md:inline-flex"
      >
        <Link href="/prijava" aria-label={dict.nav.login || "Prijava"}>
          <Icon name="person" className="text-primary text-[16px]" />
          <span className="ml-2 hidden lg:inline">{dict.nav.login || "Prijava"}</span>
        </Link>
      </Button>
    );
  }

  const user = session.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hidden h-11 min-h-11 gap-2 px-2 font-medium md:inline-flex"
          aria-label={dict.nav.account || "Moj Nalog"}
        >
          <Avatar className="size-8">
            {user.image ? <AvatarImage src={user.image} alt="" /> : null}
            <AvatarFallback className="text-[10px] font-bold">
              {initials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[8rem] truncate lg:inline">
            {user.name || dict.nav.account || "Nalog"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-semibold">{user.name || "Korisnik"}</span>
            <span className="text-muted-foreground truncate text-xs">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/moje-karte">{t?.moje_karte || "Moje karte"}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/omiljeni">{t?.omiljeni || "Omiljeni"}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/moje-recenzije">{t?.moje_recenzije || "Recenzije"}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/nalog">{t?.profile || "Nalog"}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            void authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/prijava");
                  router.refresh();
                },
              },
            });
          }}
        >
          {t?.odjava || "Odjava"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
