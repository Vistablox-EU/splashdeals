"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TAB_LABELS: Record<string, string> = {
  tickets: "Ulaznice",
  media: "Mediji",
  profile: "Profil",
  amenities: "Sadržaji",
  operations: "Radno vreme",
  faq: "FAQ",
};

export function FacilityBreadcrumb({
  facilityName,
  facilityId,
}: {
  facilityName: string;
  facilityId: string;
}) {
  const pathname = usePathname();
  const base = `/admin/facilities/${facilityId}`;
  const rest = pathname.startsWith(base) ? pathname.slice(base.length).replace(/^\//, "") : "";
  const tab = rest.split("/")[0] || "";
  const tabLabel = tab ? TAB_LABELS[tab] : null;

  return (
    <nav
      aria-label="Putanja"
      className="text-muted-foreground border-border/40 relative z-20 border-b px-4 py-2 text-xs"
    >
      <Link href="/admin/facilities" className="hover:text-foreground transition-colors">
        Objekti
      </Link>
      <span className="mx-1.5">/</span>
      {tabLabel ? (
        <>
          <Link href={base} className="hover:text-foreground transition-colors">
            {facilityName}
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground font-medium">{tabLabel}</span>
        </>
      ) : (
        <span className="text-foreground font-medium">{facilityName}</span>
      )}
    </nav>
  );
}
