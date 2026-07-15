"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function FacilityRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Facility route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md space-y-6 text-center">
        <Icon name="TriangleAlert" className="text-warning mx-auto h-16 w-16" />
        <h1 className="text-foreground text-3xl font-black uppercase italic">Neočekivani talas</h1>
        <p className="text-muted-foreground">Došlo je do greške prilikom učitavanja stranice.</p>
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
