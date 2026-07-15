import { ReactNode } from "react";
import Link from "next/link";

export default function FacilitiesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <header className="mb-4">
        <nav aria-label="Putanja" className="text-muted-foreground text-sm">
          <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">
            Admin
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/admin/facilities" className="hover:text-foreground transition-colors">
            Objekti
          </Link>
        </nav>
      </header>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
