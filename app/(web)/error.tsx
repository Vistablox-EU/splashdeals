"use client";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getClientDictionary } from "@/lib/client-dictionaries";

export default function GlobalWebError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [dict, setDict] = useState<Record<string, unknown> | null>(null);

  // Safe dictionary accessor for deeply nested keys
  const t = (...keys: string[]): string => {
    if (!dict) return "";
    let current: unknown = dict;
    for (const key of keys) {
      if (current && typeof current === "object")
        current = (current as Record<string, unknown>)[key];
      else return "";
    }
    return typeof current === "string" ? current : "";
  };

  useEffect(() => {
    console.error("Global Web Error:", error);
    let mounted = true;
    getClientDictionary().then((d) => {
      if (mounted) setTimeout(() => setDict(d as Record<string, unknown>), 0);
    });
    return () => {
      mounted = false;
    };
  }, [error]);

  // Fallback while dictionary loads (matching the style)
  if (!dict) {
    return <div className="bg-background min-h-screen" />;
  }

  return (
    <div className="bg-background selection:bg-primary/20 text-foreground relative flex min-h-screen items-center justify-center overflow-hidden p-6 md:p-12">
      {/* 🌊 Atmospheric Background Particles */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
        <div className="bg-primary/10 absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon name="waves" className="text-foreground/5 h-[80vw] w-[80vw] stroke-[0.1]" />
        </div>
      </div>

      <Card className="bg-muted/50 border-primary/10 relative z-10 w-full max-w-xl">
        <CardHeader className="items-center gap-6 p-8 pb-0 text-center md:p-16 md:pb-0">
          <div className="bg-primary/10 text-primary border-primary/20 relative inline-flex h-24 w-24 items-center justify-center rounded-full border">
            <Icon name="error" className="stroke-[1.5] text-[48px]" />
          </div>
          <div className="space-y-4">
            <CardTitle className="text-foreground text-4xl leading-none font-black tracking-tighter uppercase italic md:text-5xl">
              {(dict as Record<string, unknown>)?.errors ? (
                <>
                  {t("errors", "title")} <br />
                  <span className="text-primary">{t("errors", "highlight")}</span>
                </>
              ) : (
                ""
              )}
            </CardTitle>
            <p className="text-muted-foreground mx-auto max-w-sm text-lg leading-relaxed">
              {t("errors", "subtitle")}
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-4 text-center md:p-16 md:pt-4">
          <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
            <Button
              onClick={reset}
              variant="outline"
              className="group flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-xs font-black tracking-widest uppercase"
            >
              <Icon name="refresh" className="text-[16px]" />
              {t("errors", "try_again")}
            </Button>
            <Link
              href="/"
              className="bg-primary hover:bg-primary/90 text-background shadow-primary/10 flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-xs font-black tracking-widest uppercase shadow-2xl transition-all"
            >
              <Icon name="home" className="text-[16px]" />
              {t("errors", "back_home")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
