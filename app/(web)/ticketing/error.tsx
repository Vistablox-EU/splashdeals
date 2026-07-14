"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getClientDictionary } from "@/lib/client-dictionaries";

export default function TicketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [dict, setDict] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  useEffect(() => {
    console.error("Ticketing route error:", error);
  }, [error]);

  if (!dict) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="bg-muted h-20 w-20 animate-pulse rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-lg space-y-5 text-center">
        <div className="bg-warning/10 mx-auto flex h-20 w-20 items-center justify-center rounded-full">
          <Icon name="confirmation_number" className="text-warning h-10 w-10" />
        </div>
        <h1 className="text-foreground text-4xl font-black tracking-tight">
          {dict.ticketing_error?.title || "Greška u prodaji"}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {dict.ticketing_error?.description ||
            "Došlo je do neočekivane greške prilikom učitavanja ulaznica. Pokušajte ponovo ili nas kontaktirajte ako problem potraje."}
        </p>
        <p className="text-muted-foreground/50 text-xs">
          Greška: {error.message || dict.ticketing_error?.unknown_error || "Nepoznata greška"}
        </p>
        <p className="text-muted-foreground/60 text-xs">
          {dict.ticketing_error?.help_text ||
            "Ako problem potraje, proverite da li je izabrani objekat još uvek aktivan ili nam pišite na podrška@splashdeals.rs"}
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={reset} variant="default">
            {dict.ticketing_error?.try_again || "Pokušaj ponovo"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/">{dict.ticketing_error?.back_home || "Nazad na početnu"}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
