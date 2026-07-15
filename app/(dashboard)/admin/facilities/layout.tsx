import { ReactNode } from "react";

/**
 * Facilities segment layout — no local breadcrumb.
 * Global AdminLayoutShell Breadcrumbs is the single source of truth (audit M5).
 */
export default function FacilitiesLayout({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col">{children}</div>;
}
