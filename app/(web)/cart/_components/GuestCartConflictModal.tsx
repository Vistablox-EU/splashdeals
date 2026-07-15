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

export function GuestCartConflictModal({
  open,
  guestFacilityId,
  userFacilityId,
  resolving,
  onChooseGuest,
  onChooseUser,
}: {
  open: boolean;
  guestFacilityId: string;
  userFacilityId: string;
  resolving: boolean;
  onChooseGuest: () => void;
  onChooseUser: () => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Izaberite koju korpu želite da zadržite</DialogTitle>
          <DialogDescription>
            Gostujuća korpa i nalog imaju karte za različite objekte. Možete zadržati samo jednu
            korpu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border p-3">
            <p className="font-semibold">Gostujuća korpa</p>
            <p className="text-muted-foreground">Objekat: {guestFacilityId}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-semibold">Korpa naloga</p>
            <p className="text-muted-foreground">Objekat: {userFacilityId}</p>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button disabled={resolving} onClick={onChooseGuest} className="w-full">
            Zadrži gostujuću korpu
          </Button>
          <Button disabled={resolving} variant="outline" onClick={onChooseUser} className="w-full">
            Zadrži korpu naloga
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
