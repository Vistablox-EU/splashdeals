"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { Dict } from "@/lib/types";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  breadcrumbItems: BreadcrumbItem[];
  backHref?: string;
  hasBreadcrumbs: boolean;
  dict?: Dict;
}

export function Breadcrumb({ breadcrumbItems, backHref, hasBreadcrumbs, dict }: BreadcrumbProps) {
  return (
    <>
      {hasBreadcrumbs && (
        <div className="border-border/10 w-full overflow-hidden border-t transition-all duration-200 md:hidden">
          <div className="mx-auto flex h-9 w-full max-w-7xl items-center gap-0 px-0 py-0">
            {/* Back button */}
            {backHref && (
              <Link
                href={backHref}
                className="border-border/10 text-muted-foreground hover:text-foreground active:bg-muted/10 flex h-full shrink-0 items-center justify-center border-r px-4 transition-colors"
                aria-label={dict?.breadcrumb?.back_aria ?? "Nazad"}
              >
                <Icon name="arrow_back" className="text-[14px]" />
                <span className="sr-only">{dict?.breadcrumb?.back_aria ?? "Nazad"}</span>
              </Link>
            )}

            {/* Scrollable breadcrumb trail */}
            <div className="no-scrollbar flex-1 overflow-x-auto">
              <div className="flex h-9 items-center gap-0 px-3 whitespace-nowrap">
                {breadcrumbItems.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && (
                      <Icon
                        name="keyboard_arrow_right"
                        className="text-muted-foreground mx-1 shrink-0 text-[12px]"
                      />
                    )}
                    {item.href && idx < breadcrumbItems.length - 1 ? (
                      item.href === "/" ? (
                        <Link
                          href={item.href}
                          className="text-muted-foreground hover:text-primary inline-flex min-w-[36px] items-center justify-center px-2 py-1.5 text-[14px] transition-colors"
                          aria-label={item.label}
                        >
                          <Icon name="home" />
                          <span className="sr-only">{item.label}</span>
                        </Link>
                      ) : (
                        <Link
                          href={item.href}
                          className="text-muted-foreground hover:text-primary px-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors"
                        >
                          {item.label}
                        </Link>
                      )
                    ) : item.href === "/" ? (
                      <span className="text-primary inline-flex min-w-[36px] items-center justify-center px-2 py-1.5 text-[14px]">
                        <Icon name="home" />
                        <span className="sr-only">{item.label}</span>
                      </span>
                    ) : (
                      <span className="text-primary px-0.5 text-[10px] font-black tracking-wider uppercase">
                        {item.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
