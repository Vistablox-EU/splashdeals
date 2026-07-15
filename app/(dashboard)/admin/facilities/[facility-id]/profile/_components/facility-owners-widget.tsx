"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  listFacilityOwnersAction,
  assignFacilityOwnerAction,
  removeFacilityOwnerAction,
} from "@/app/(server)/actions/facility-owners";

type OwnerRow = { userId: string; email: string; name: string | null };

export function FacilityOwnersWidget({ facilityId }: { facilityId: string }) {
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  const reload = () => {
    startTransition(async () => {
      const res = await listFacilityOwnersAction(facilityId);
      if (res.success && res.data) setOwners(res.data);
    });
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  return (
    <div className="border-border bg-card space-y-3 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <Icon name="group" className="text-primary text-[16px]" />
        <h3 className="text-xs font-black tracking-widest uppercase">Vlasnici / partneri</h3>
      </div>
      <ul className="space-y-2">
        {owners.length === 0 && (
          <li className="text-muted-foreground text-xs">Nema dodeljenih vlasnika.</li>
        )}
        {owners.map((o) => (
          <li key={o.userId} className="flex items-center justify-between text-xs">
            <span>
              {o.name || o.email}
              <span className="text-muted-foreground ml-2 font-mono text-[10px]">{o.email}</span>
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive h-7 text-[10px]"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await removeFacilityOwnerAction(facilityId, o.userId);
                  if (res.success) {
                    toast.success("Vlasnik uklonjen");
                    reload();
                  } else toast.error(res.error || "Greška");
                })
              }
            >
              Ukloni
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@partner.rs"
          className="h-9 text-xs"
          aria-label="Email vlasnika"
        />
        <Button
          size="sm"
          className="h-9"
          disabled={pending || !email.trim()}
          onClick={() =>
            startTransition(async () => {
              const res = await assignFacilityOwnerAction(facilityId, email.trim());
              if (res.success) {
                toast.success("Vlasnik dodeljen");
                setEmail("");
                reload();
              } else toast.error(res.error || "Greška");
            })
          }
        >
          Dodaj
        </Button>
      </div>
    </div>
  );
}
