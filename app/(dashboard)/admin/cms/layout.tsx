import type { ReactNode } from "react";
import { CmsNav } from "./_components/cms-nav";

/**
 * CMS section chrome — secondary nav for desktop admin.
 * Route groups under cms/ do not appear in the URL.
 */
export default function CmsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <CmsNav />
      {children}
    </div>
  );
}
