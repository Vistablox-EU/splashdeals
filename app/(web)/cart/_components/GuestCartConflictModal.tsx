"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CartDictionary } from "@/lib/types/cart";

export function GuestCartConflictModal({
  open,
  guestFacilityName,
  userFacilityName,
  resolving,
  onChooseGuest,
  onChooseUser,
  dict,
}: {
  open: boolean;
  guestFacilityName: string;
  userFacilityName: string;
  resolving: boolean;
  onChooseGuest: () => void;
  onChooseUser: () => void;
  dict?: CartDictionary | null;
}) {
  const facilityLine = (name: string) =>
    (dict?.conflict_facility || "{name}").replace("{name}", name);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{dict?.conflict_title}</DialogTitle>
          <DialogDescription>{dict?.conflict_description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border p-3">
            <p className="font-semibold">{dict?.conflict_guest_label}</p>
            <p className="text-muted-foreground">{facilityLine(guestFacilityName)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-semibold">{dict?.conflict_user_label}</p>
            <p className="text-muted-foreground">{facilityLine(userFacilityName)}</p>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button disabled={resolving} onClick={onChooseGuest} className="w-full">
            {dict?.conflict_keep_guest}
          </Button>
          <Button disabled={resolving} variant="outline" onClick={onChooseUser} className="w-full">
            {dict?.conflict_keep_user}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
