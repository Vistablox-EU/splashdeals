"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";

export default function PostsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[cms-posts]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Icon name="error" className="text-destructive size-12" />
      <h2 className="text-xl font-semibold">Došlo je do greške</h2>
      <p className="text-muted-foreground max-w-md text-center text-sm">
        {error.message || "Neočekivana greška u objavama."}
      </p>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
      >
        <Icon name="refresh" className="size-4" />
        Pokušaj ponovo
      </button>
    </div>
  );
}
