"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

export default function CMSPostEditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[cms-posts-[post-id]]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Icon name="error" className="text-destructive size-12" />
      <h2 className="text-xl font-semibold">Došlo je do greške</h2>
      <p className="text-muted-foreground max-w-md text-center text-sm">
        {error.message || "Neočekivana greška u uredivanju objave."}
      </p>
      <Button onClick={reset}>
        <Icon name="refresh" className="size-4" />
        Pokušaj ponovo
      </Button>
    </div>
  );
}
