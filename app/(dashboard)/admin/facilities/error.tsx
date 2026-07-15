"use client";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import Link from "next/link";

export default function FacilitiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Facilities Error:", error);
  }, [error]);

  return (
    <div className="relative flex min-h-[60vh] items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-10">
        <div className="bg-primary/10 absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6 p-8 text-center">
        <div className="bg-muted/30 border-border text-muted-foreground inline-flex h-20 w-20 items-center justify-center rounded-full border">
          <Icon name="gpp_maybe" className="text-[40px]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-foreground text-2xl font-black tracking-tighter uppercase italic">
            Objekti <span className="text-muted-foreground">Greška</span>
          </h1>
          <p className="text-muted-foreground mx-auto max-w-xs text-sm">
            Nije moguće učitati listu objekata. Molimo pokušajte ponovo.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={reset}
            variant="outline"
            className="bg-muted/30 hover:bg-muted/50 border-border/50 flex w-full items-center justify-center gap-2 rounded-xl border px-8 py-4 text-[10px] font-black tracking-widest uppercase transition-colors"
          >
            <Icon name="refresh" className="text-[16px]" />
            Pokušaj ponovo
          </Button>
          <Button
            asChild
            variant="secondary"
            className="bg-muted/80 hover:bg-foreground/10 text-foreground flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 text-[10px] font-black tracking-widest uppercase transition-colors"
          >
            <Link href="/admin/facilities">
              <Icon name="apartment" className="text-[16px]" />
              Svi objekti
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
