"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function TicketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Ticketing route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-lg space-y-5 text-center">
        <div className="bg-warning/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
          <Icon name="confirmation_number" className="text-warning h-10 w-10" />
        </div>
        <h1 className="text-foreground text-4xl font-black tracking-tight">Greška u prodaji</h1>
        <p className="text-muted-foreground leading-relaxed">
          Došlo je do neočekivane greške prilikom učitavanja ulaznica. Pokušajte ponovo ili nas
          kontaktirajte ako problem potraje.
        </p>
        <p className="text-muted-foreground/50 text-xs">
          Greška: {error.message || "Nepoznata greška"}
        </p>
        <p className="text-muted-foreground/60 text-xs">
          Ako problem potraje, proverite da li je izabrani objekat još uvek aktivan ili nam pišite
          na podrška@splashdeals.rs
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={reset} variant="default">
            Pokušaj ponovo
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Nazad na početnu</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
