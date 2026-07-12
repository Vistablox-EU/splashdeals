"use client";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getClientDictionary } from "@/lib/client-dictionaries";

/**
 * 🛡️ Aquastream Merchant-Safe Error Boundary
 */
export default function FacilityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dict, setDict] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    console.error("Facility Showcase Error:", error);
    let mounted = true;
    getClientDictionary().then((d) => {
      if (mounted) setTimeout(() => setDict(d), 0);
    });
    return () => {
      mounted = false;
    };
  }, [error]);

  if (!dict) {
    return <div className="bg-background min-h-screen" />;
  }

  return (
    <div className="bg-background text-foreground selection:bg-destructive/20 relative flex min-h-screen items-center justify-center overflow-hidden p-6 md:p-12">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
        <div className="bg-destructive/10 absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon name="waves" className="text-muted/30 h-[80vw] w-[80vw] stroke-[0.1]" />
        </div>
      </div>

      <Card className="bg-card/50 border-destructive/10 relative z-10 w-full max-w-xl">
        <CardHeader className="items-center gap-6 p-8 pb-0 text-center md:p-16 md:pb-0">
          <div className="group border-destructive/20 bg-destructive/10 text-destructive relative inline-flex h-24 w-24 items-center justify-center rounded-full border">
            <Icon name="error" className="stroke-[1.5] text-[48px]" />
          </div>
          <div className="space-y-4">
            <CardTitle className="text-foreground text-4xl leading-none font-black tracking-tighter uppercase italic md:text-5xl">
              Turbulencije <br />
              <span className="text-destructive">Pod Vodom</span>
            </CardTitle>
            <p className="text-muted-foreground mx-auto max-w-sm text-lg leading-relaxed">
              Došlo je do neočekivanog talasa prilikom učitavanja ove destinacije. Naš tim ga već
              smiruje.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-4 text-center md:p-16 md:pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button
              variant="outline"
              onClick={reset}
              className="bg-muted/50 hover:bg-muted border-border group flex items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-[10px] font-black tracking-widest uppercase transition-colors"
            >
              <Icon name="refresh" className="text-[16px]" />
              {dict.errors.try_again}
            </Button>
            <Link
              href="/"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-[10px] font-black tracking-widest uppercase shadow-2xl transition-colors"
            >
              <Icon name="home" className="text-[16px]" />
              {dict.errors.back_home}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
