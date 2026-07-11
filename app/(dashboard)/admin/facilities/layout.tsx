import { ReactNode } from "react";

export default function FacilitiesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <header className="mb-4">
        <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
          Admin / Facilities
        </nav>
      </header>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
