"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { Dict } from "@/lib/types";

export function StaffRoleBanner({ dict, role }: { dict: Dict; role?: string | null }) {
  const t = dict.account as Record<string, string> | undefined;
  return (
    <div className="border-primary/30 bg-primary/5 flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <Icon name="admin_panel_settings" className="text-primary mt-0.5 size-5 shrink-0" />
        <div>
          <p className="text-sm font-bold">{t?.staff_banner_title || "Imate partnerski pristup"}</p>
          <p className="text-muted-foreground text-xs">
            {t?.staff_banner_desc ||
              "Prijavljeni ste kao partner/admin. Buyer nalog i dalje radi za karte i omiljene."}
            {role ? ` (${role})` : ""}
          </p>
        </div>
      </div>
      <Link
        href="/admin"
        className="bg-primary text-primary-foreground inline-flex h-11 min-h-11 items-center justify-center rounded-full px-5 text-xs font-bold whitespace-nowrap"
      >
        {t?.staff_banner_cta || "Otvori admin panel"}
      </Link>
    </div>
  );
}
