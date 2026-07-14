"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

export default function AccountError({
  _error,
  reset,
  dict,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
  dict?: Record<string, any>;
}) {
  const t = (dict?.account as Record<string, any>) || {};

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <Icon name="error_outline" className="text-destructive size-12" />
      <div>
        <h2 className="mb-2 text-xl font-black tracking-tight uppercase">
          {t.error_title || "Došlo je do greške"}
        </h2>
        <p className="text-muted-foreground max-w-md text-sm font-medium">
          {t.error_description ||
            "Nismo mogli da učitamo ovu stranicu. Pokušajte ponovo ili nas kontaktirajte."}
        </p>
      </div>
      <Button onClick={reset} variant="default">
        {t.error_retry || "Pokušaj ponovo"}
      </Button>
    </div>
  );
}
