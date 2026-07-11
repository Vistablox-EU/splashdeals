"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { deleteFacilityAction } from "@/server/actions/facilities";

interface DangerZoneProps {
  facilityId: string;
  facilityName: string;
  userRole: string;
  transactionCount: number;
}

/**
 * ⚠️ DangerZone Component (Aquastream UI Pro Max)
 *
 * Implements high-friction, Super Admin-gated deletion with cascade transaction safeguards.
 * Respects strict color-ban rules (Absolutely NO purple/indigo/violet).
 */
export function DangerZone({
  facilityId,
  facilityName,
  userRole,
  transactionCount,
}: DangerZoneProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmName, setConfirmName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const hasTransactions = transactionCount > 0;

  const handleDelete = () => {
    if (confirmName !== facilityName) {
      toast.error("Ime za verifikaciju se ne podudara.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteFacilityAction(facilityId);
        if (result.success) {
          toast.success("Objekat uspešno obrisan");
          setIsOpen(false);
          router.push("/admin/facilities");
          router.refresh();
        } else {
          toast.error(result.error || "Greška pri brisanju objekta");
        }
      } catch (error: unknown) {
        console.error("Failed to delete facility:", error instanceof Error ? error.message : error);
        toast.error("Došlo je do greške tokom brisanja.");
      }
    });
  };

  return (
    <Card className="border-destructive/20 bg-destructive/5 space-y-6 p-6 backdrop-blur-md">
      <div className="border-destructive/10 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-destructive/10 rounded-lg p-2">
            <Icon name="warning" className="text-destructive text-[16px]" />
          </div>
          <div>
            <h3 className="text-foreground text-xs font-black tracking-wider uppercase">
              Zona opasnosti
            </h3>
            <p className="text-destructive/60 mt-0.5 text-[9px] font-bold tracking-widest uppercase">
              Katastrofalne radnje i brisanje registra
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {!isSuperAdmin ? (
          <div className="bg-background/40 border-border/50 flex items-start gap-3 rounded-xl border p-4">
            <Icon name="lock" className="text-muted-foreground mt-0.5 shrink-0 text-[16px]" />
            <div className="space-y-1">
              <p className="text-foreground/80 text-xs font-black tracking-wider uppercase">
                Administrativna zaštita aktivna
              </p>
              <p className="text-muted-foreground text-[10px] leading-normal font-medium">
                Vaša uloga ({userRole}) nema dovoljne privilegije za brisanje objekata.
                Kontaktirajte Super Administratora za izvršenje brisanja.
              </p>
            </div>
          </div>
        ) : hasTransactions ? (
          <div className="bg-background/40 border-destructive/10 flex items-start gap-3 rounded-xl border p-4">
            <Icon name="lock" className="text-destructive mt-0.5 shrink-0 text-[16px]" />
            <div className="space-y-1">
              <p className="text-destructive text-xs font-black tracking-wider uppercase">
                Brisanje zaključano
              </p>
              <p className="text-muted-foreground text-[10px] leading-relaxed font-medium">
                Ovaj objekat je povezan sa{" "}
                <strong className="text-foreground">
                  {transactionCount} aktivnih ili istorijskih transakcija
                </strong>{" "}
                u sistemskom registru. Potpuno brisanje je onemogućeno radi očuvanja računovodstvenih
                revizija. Postavite status objekta na <strong className="text-foreground">CLOSED</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-background/40 border-destructive/10 flex flex-col justify-between gap-4 rounded-xl border p-4 md:flex-row md:items-center">
            <div className="max-w-xl space-y-1">
              <p className="text-foreground text-xs font-black tracking-wider uppercase">
                Obriši objekat
              </p>
              <p className="text-muted-foreground text-[10px] leading-normal font-medium">
                Trajno briše <strong className="text-foreground/80">{facilityName}</strong>{" "}
                zajedno sa svim povezanim ulaznicama, radnim vremenom, sadržajima, zatvaranjima i
                osobljem. Ova radnja je apsolutna i ne može se poništiti.
              </p>
            </div>

            <Dialog
              open={isOpen}
              onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) setConfirmName("");
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground h-10 shrink-0 rounded-xl px-6 text-[9px] font-black tracking-widest uppercase transition-all duration-300"
                >
                  <Icon name="delete" className="mr-2 size-3.5" />
                  Obriši objekat
                </Button>
              </DialogTrigger>

              <DialogContent className="bg-background border-border text-foreground max-w-md rounded-2xl p-6 outline-none">
                <DialogHeader className="space-y-3">
                  <div className="text-destructive flex items-center gap-2">
                    <Icon name="warning" className="size-5 shrink-0" />
                    <DialogTitle className="text-base font-black tracking-wider uppercase">
                      Potpuno brisanje registra
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-muted-foreground text-xs leading-normal">
                    Ova radnja je{" "}
                    <strong className="text-destructive uppercase">destruktivna</strong> i potpuno
                    će obrisati <strong className="text-foreground">{facilityName}</strong> iz
                    baze podataka. Trenutno će kaskadno obrisati:
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                  <ul className="text-muted-foreground list-disc space-y-1 pl-5 font-mono text-[9px] tracking-wider uppercase">
                    <li>Sve cene i aktivne ulaznice</li>
                    <li>Rasporede, radno vreme i izuzetke</li>
                    <li>Medijske asocijacije i galeriju</li>
                    <li>Osoblje i lokalne registarske zapise</li>
                  </ul>

                  <div className="border-border/50 space-y-2 border-t pt-4">
                    <label className="text-muted-foreground text-[10px] font-black tracking-wider uppercase">
                      Za potvrdu, unesite tačno ime objekta{" "}
                      <span className="text-foreground select-none">
                        &quot;{facilityName}&quot;
                      </span>{" "}
                      ispod:
                    </label>
                    <Input
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      placeholder={facilityName}
                      className="bg-muted/30 border-border text-foreground focus:border-destructive/50 h-10 rounded-lg px-3 text-xs"
                      disabled={isPending}
                    />
                  </div>
                </div>

                <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      setConfirmName("");
                    }}
                    className="border-border/50 bg-muted/30 hover:bg-muted/50 text-foreground h-10 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all"
                    disabled={isPending}
                  >
                    Otkaži
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending || confirmName !== facilityName}
                    className="text-destructive-foreground bg-destructive hover:bg-destructive/90 disabled:bg-destructive/20 disabled:text-destructive/50 flex h-10 min-w-[120px] items-center justify-center rounded-xl text-[9px] font-black tracking-widest uppercase transition-all"
                  >
                    {isPending ? (
                      <Icon name="progress_activity" className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <Icon name="delete" className="mr-2 size-3.5" />
                        Obriši objekat
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </Card>
  );
}
