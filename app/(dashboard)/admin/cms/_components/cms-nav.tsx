"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CMS_NAV, isCmsNavActive } from "../_lib/cms-nav";
import { cn } from "@/lib/utils";

export function CmsNav() {
  const pathname = usePathname() || "";

  return (
    <nav
      aria-label="CMS navigacija"
      className="border-border/60 bg-muted/20 no-scrollbar -mx-1 flex gap-1 overflow-x-auto rounded-xl border p-1"
    >
      {CMS_NAV.map((item) => {
        const active = isCmsNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-xs font-bold tracking-wide whitespace-nowrap uppercase transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
