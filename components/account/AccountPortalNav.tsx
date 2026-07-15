"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { Dict } from "@/lib/types";

export type AccountNavLink = {
  href: string;
  label: string;
  icon: string;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/moje-karte") {
    return pathname === "/moje-karte";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Account sub-navigation for platform shell:
 * - desktop: sidebar
 * - mobile: horizontal chips under header (NOT a second fixed BottomNav)
 */
export function AccountPortalNav({
  links,
  title,
  logoutLabel,
}: {
  links: AccountNavLink[];
  title: string;
  logoutLabel: string;
  dict?: Dict;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/prijava");
            router.refresh();
          },
        },
      });
    });
  };

  return (
    <>
      {/* Mobile chips — scrollable, not fixed bottom */}
      <nav
        className="border-border/40 bg-background/95 sticky top-[6.5rem] z-[90] -mx-4 mb-6 border-b px-4 py-2 backdrop-blur-md lg:hidden"
        aria-label={title}
      >
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold tracking-wide whitespace-nowrap uppercase transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40",
                )}
              >
                <Icon name={link.icon} className="size-4" />
                {link.label}
              </Link>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-11 min-h-11 shrink-0 px-3 text-[11px] font-bold tracking-wide uppercase"
            onClick={handleLogout}
            disabled={isPending}
          >
            <Icon name="logout" className="size-4" />
            {logoutLabel}
          </Button>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <nav
          className="border-border sticky top-28 space-y-1 rounded-xl border p-4"
          aria-label={title}
        >
          <h2 className="text-muted-foreground mb-4 px-3 text-[10px] font-black tracking-[0.2em] uppercase">
            {title}
          </h2>
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground",
                )}
              >
                <Icon name={link.icon} className="text-primary size-[18px]" />
                {link.label}
              </Link>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground mt-2 h-11 w-full justify-start gap-3 px-3"
            onClick={handleLogout}
            disabled={isPending}
          >
            <Icon name="logout" className="size-[18px]" />
            {logoutLabel}
          </Button>
        </nav>
      </aside>
    </>
  );
}
