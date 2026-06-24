"use client"

import { Icon } from "@/components/ui/Icon"

/**
 * Scanner visual block — shows a mock QR scan confirmation.
 */
export function ScannerBlock() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm border bg-muted/10 p-6 text-center">
      <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon name="qr_code_scanner" className="size-6 text-primary" />
      </div>
      <div>
        <span className="block text-sm font-medium">Skeniranje uspešno</span>
        <span className="block text-xs text-muted-foreground mt-0.5">
          Ulaznica #PETR-401A je verifikovana
        </span>
      </div>
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
        <Icon name="check_circle" className="size-3" />
        Validirano
      </span>
    </div>
  )
}

/**
 * Club Card visual block — shows a mock splash club membership card.
 */
export function ClubCardBlock() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm border bg-muted/10 p-6 text-center">
      <div className="w-28 aspect-[2/3] rounded-xl bg-gradient-to-b from-primary/10 to-muted border p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between border-b pb-1.5">
          <span className="text-[7px] font-bold text-primary uppercase">
            Splash Club
          </span>
          <Icon name="waves" className="size-2.5 text-primary" />
        </div>
        <div className="text-center">
          <span className="text-[6px] font-medium text-muted-foreground uppercase block">
            Članska Kartica
          </span>
          <span className="text-[10px] font-bold uppercase block mt-0.5">
            PREMIUM PRO
          </span>
        </div>
        <div className="border-t pt-1.5 flex flex-col items-center">
          <Icon name="qr_code" className="size-6" />
          <span className="text-[4px] text-muted-foreground mt-0.5">
            #SPLASH-PASS
          </span>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
        <Icon name="auto_awesome" className="size-3" />
        Splash Club
      </span>
    </div>
  )
}
