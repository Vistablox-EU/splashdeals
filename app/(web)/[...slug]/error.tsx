"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function CatchAllError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Catch-all route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <Icon name="TriangleAlert" className="w-16 h-16 text-amber-500 mx-auto" />
        <h1 className="text-3xl font-black uppercase italic text-white">
          Neočekivani talas
        </h1>
        <p className="text-muted-foreground">
          Došlo je do greške prilikom učitavanja stranice.
        </p>
        <div className="flex gap-4 justify-center">
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
