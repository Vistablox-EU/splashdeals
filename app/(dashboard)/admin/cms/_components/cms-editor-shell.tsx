"use client";

import type { ReactNode } from "react";

/**
 * Shared two-column CMS editor chrome (main form + sticky sidebar).
 * Domain-specific fields stay in post/page editors; layout is SSOT here.
 */
export function CmsEditorShell({
  header,
  banners,
  main,
  sidebar,
}: {
  header?: ReactNode;
  banners?: ReactNode;
  main: ReactNode;
  sidebar: ReactNode;
}) {
  return (
    <div>
      {header}
      {banners}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">{main}</div>
        <div className="space-y-6">{sidebar}</div>
      </div>
    </div>
  );
}

/** Consistent bordered sidebar card used by publish/SEO/social/etc. panels */
export function CmsEditorSidebarCard({
  title,
  children,
  className = "space-y-3 rounded-lg border p-4",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {title ? <h3 className="text-sm font-medium">{title}</h3> : null}
      {children}
    </div>
  );
}
