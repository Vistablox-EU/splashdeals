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
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md space-y-6 text-center">
        <Icon name="confirmation_number" className="text-warning mx-auto h-16 w-16" />
        <h1 className="text-foreground text-3xl font-black uppercase italic">Greška u prodaji</h1>
        <p className="text-muted-foreground">
          Došlo je do neočekivane greške prilikom učitavanja ulaznica. Pokušajte ponovo ili nas
          kontaktirajte.
        </p>
        <p className="text-muted-foreground/60 text-xs">
          Ako problem potraje, proverite da li je izabrani objekat još uvek aktivan ili nam
          pišite na podrška@splashdeals.rs
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
