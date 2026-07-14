"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { getClientDictionary } from "@/lib/client-dictionaries";
import type { Dict } from "@/lib/types";

/**
 * Scanner visual block — shows a mock QR scan confirmation.
 */
export function ScannerBlock() {
  const [dict, setDict] = useState<Dict | null>(null);

  useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  return (
    <div className="bg-muted/10 flex flex-col items-center gap-3 rounded-sm border p-6 text-center">
      <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
        <Icon name="qr_code_scanner" className="text-primary size-6" />
      </div>
      <div>
        <span className="block text-sm font-medium">
          {dict?.visual_blocks?.scan_successful || "Skeniranje uspešno"}
        </span>
        <span className="text-muted-foreground mt-0.5 block text-xs">
          {dict?.visual_blocks?.ticket_verified || "Ulaznica #PETR-401A je verifikovana"}
        </span>
      </div>
      <span className="text-primary bg-primary/10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
        <Icon name="check_circle" className="size-3" />
        {dict?.visual_blocks?.validated || "Validirano"}
      </span>
    </div>
  );
}

/**
 * Club Card visual block — shows a mock splash club membership card.
 */
export function ClubCardBlock() {
  const [dict, setDict] = useState<Dict | null>(null);

  useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  return (
    <div className="bg-muted/10 flex flex-col items-center gap-3 rounded-sm border p-6 text-center">
      <div className="from-primary/10 to-muted flex aspect-[2/3] w-28 flex-col justify-between rounded-xl border bg-gradient-to-b p-3 shadow-sm">
        <div className="flex items-center justify-between border-b pb-1.5">
          <span className="text-primary text-[7px] font-bold uppercase">
            {dict?.visual_blocks?.splash_club || "Splash Club"}
          </span>
          <Icon name="waves" className="text-primary size-2.5" />
        </div>
        <div className="text-center">
          <span className="text-muted-foreground block text-[6px] font-medium uppercase">
            {dict?.visual_blocks?.club_card || "Članska Kartica"}
          </span>
          <span className="mt-0.5 block text-[10px] font-bold uppercase">
            {dict?.visual_blocks?.premium_pro || "PREMIUM PRO"}
          </span>
        </div>
        <div className="flex flex-col items-center border-t pt-1.5">
          <Icon name="qr_code" className="size-6" />
          <span className="text-muted-foreground mt-0.5 text-[4px]">
            {dict?.visual_blocks?.splash_pass || "#SPLASH-PASS"}
          </span>
        </div>
      </div>
      <span className="text-primary bg-primary/10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
        <Icon name="auto_awesome" className="size-3" />
        {dict?.visual_blocks?.splash_club || "Splash Club"}
      </span>
    </div>
  );
}
