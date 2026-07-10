"use client";
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
    <div className="bg-background text-foreground relative flex min-h-screen items-center justify-center overflow-hidden p-6 selection:bg-red-500/20 md:p-12">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-[120px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon name="waves" className="text-muted/30 h-[80vw] w-[80vw] stroke-[0.1]" />
        </div>
      </div>

      <Card className="bg-card/50 relative z-10 w-full max-w-xl border-red-500/10">
        <CardHeader className="items-center gap-6 p-8 pb-0 text-center md:p-16 md:pb-0">
          <div className="group relative inline-flex h-24 w-24 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
            <Icon name="error" className="stroke-[1.5] text-[48px]" />
          </div>
          <div className="space-y-4">
            <CardTitle className="text-foreground text-4xl leading-none font-black tracking-tighter uppercase italic md:text-5xl">
              Turbulencije <br />
              <span className="text-red-400">Pod Vodom</span>
            </CardTitle>
            <p className="text-muted-foreground mx-auto max-w-sm text-lg leading-relaxed">
              Došlo je do neočekivanog talasa prilikom učitavanja ove destinacije. Naš tim ga već
              smiruje.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-4 text-center md:p-16 md:pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              onClick={reset}
              className="bg-muted/50 hover:bg-muted border-border group flex items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-[10px] font-black tracking-widest uppercase transition-all"
            >
              <Icon name="refresh" className="text-[16px]" />
              {dict.errors.try_again}
            </button>
            <Link
              href="/"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-[10px] font-black tracking-widest uppercase shadow-2xl transition-all"
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
