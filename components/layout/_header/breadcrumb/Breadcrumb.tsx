"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  breadcrumbItems: BreadcrumbItem[];
  backHref?: string;
  hasBreadcrumbs: boolean;
}

export function Breadcrumb({ breadcrumbItems, backHref, hasBreadcrumbs }: BreadcrumbProps) {
  return (
    <>
      {hasBreadcrumbs && (
        <div
          className="overflow-hidden md:hidden w-full border-t border-white/5 transition-all duration-200"
        >
          <div className="max-w-7xl mx-auto w-full flex items-center gap-0 px-0 py-0 h-9">
            {/* Back button */}
            {backHref && (
              <Link
                href={backHref}
                className="shrink-0 flex items-center justify-center h-full px-4 text-slate-400 hover:text-white border-r border-white/5 transition-colors active:bg-white/5"
                aria-label="Nazad"
              >
                <Icon name="arrow_back" className="text-[14px]" />
                <span className="sr-only">Nazad</span>
              </Link>
            )}

            {/* Scrollable breadcrumb trail */}
            <div className="flex-1 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-0 whitespace-nowrap px-3 h-9">
                {breadcrumbItems.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && (
                      <Icon name="keyboard_arrow_right" className="text-[12px] text-slate-600 shrink-0 mx-1" />
                    )}
                    {item.href && idx < breadcrumbItems.length - 1 ? (
                      item.href === "/" ? (
                        <Link
                          href={item.href}
                          className="text-[14px] text-slate-400 hover:text-cyan-400 transition-colors px-2 py-1.5 inline-flex items-center justify-center min-w-[36px]"
                          aria-label={item.label}
                        >
                          <Icon name="home" />
                          <span className="sr-only">{item.label}</span>
                        </Link>
                      ) : (
                        <Link
                          href={item.href}
                          className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-cyan-400 transition-colors px-0.5"
                        >
                          {item.label}
                        </Link>
                      )
                    ) : (
                      item.href === "/" ? (
                        <span className="text-[14px] text-cyan-400 px-2 py-1.5 inline-flex items-center justify-center min-w-[36px]">
                          <Icon name="home" />
                          <span className="sr-only">{item.label}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 px-0.5">
                          {item.label}
                        </span>
                      )
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
