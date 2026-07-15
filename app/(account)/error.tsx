"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { useEffect, useState } from "react";
import { getClientDictionary } from "@/lib/client-dictionaries";
import type { Dict } from "@/lib/types";

export default function AccountError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [dict, setDict] = useState<Dict | null>(null);

  useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  const t = dict?.account;

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <Icon name="error_outline" className="text-destructive size-12" />
      <div>
        <h2 className="mb-2 text-xl font-black tracking-tight uppercase">
          {t?.error_title || "Došlo je do greške"}
        </h2>
        <p className="text-muted-foreground max-w-md text-sm font-medium">
          {t?.error_description ||
            "Nismo mogli da učitamo ovu stranicu. Pokušajte ponovo ili nas kontaktirajte."}
        </p>
      </div>
      <Button onClick={reset} variant="default" className="h-11 min-h-11">
        {t?.error_retry || "Pokušaj ponovo"}
      </Button>
    </div>
  );
}
