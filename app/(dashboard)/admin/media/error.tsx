"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MediaLibraryError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Media library error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Icon name="error" className="text-destructive size-12" />
      <div className="text-center">
        <h2 className="text-lg font-semibold">Greška pri učitavanju</h2>
        <p className="text-muted-foreground mt-1 max-w-md text-sm">
          Došlo je do greške prilikom učitavanja medija biblioteke. Molimo pokušajte ponovo.
        </p>
      </div>
      <Button variant="outline" onClick={reset}>
        <Icon name="refresh" className="size-4" />
        Pokušaj ponovo
      </Button>
    </div>
  );
}
