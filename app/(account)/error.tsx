"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <Icon name="error_outline" className="text-destructive size-12" />
      <div>
        <h2 className="mb-2 text-xl font-black tracking-tight uppercase">Došlo je do greške</h2>
        <p className="text-muted-foreground max-w-md text-sm font-medium">
          Nismo mogli da učitamo ovu stranicu. Pokušajte ponovo ili nas kontaktirajte.
        </p>
      </div>
      <Button onClick={reset} variant="default">
        Pokušaj ponovo
      </Button>
    </div>
  );
}
