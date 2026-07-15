"use client";

import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type PublishReadinessItem = {
  id: string;
  label: string;
  ok: boolean;
  href: string;
};

export function PublishReadinessCard({
  facilityId,
  status,
  items,
}: {
  facilityId: string;
  status: string;
  items: PublishReadinessItem[];
}) {
  const ready = items.every((i) => i.ok);
  return (
    <div className="border-border/50 bg-muted/30 space-y-3 rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase">
          <Icon name="checklist" className="text-primary text-[14px]" />
          Spremnost za objavu
        </div>
        <Badge variant={ready ? "default" : "secondary"}>{ready ? "Spremno" : "Nedovršeno"}</Badge>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <Icon
                name={item.ok ? "check_circle" : "radio_button_unchecked"}
                className={
                  item.ok ? "text-primary text-[14px]" : "text-muted-foreground text-[14px]"
                }
              />
              {item.label}
            </span>
            {!item.ok && (
              <Link
                href={item.href}
                className="text-primary text-[10px] font-bold uppercase hover:underline"
              >
                Otvori
              </Link>
            )}
          </li>
        ))}
      </ul>
      {status === "ACTIVE" && !ready && (
        <p className="text-destructive text-[10px] font-medium">
          Objekat je aktivan, ali checklist nije kompletan.
        </p>
      )}
      {status !== "ACTIVE" && ready && (
        <p className="text-muted-foreground text-[10px]">
          Checklist je kompletan — možete aktivirati objekat iz navigacije.
        </p>
      )}
      <Link
        href={`/admin/facilities/${facilityId}/profile`}
        className="text-muted-foreground hover:text-foreground text-[10px] font-black tracking-widest uppercase"
      >
        Profil i status →
      </Link>
    </div>
  );
}
