"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

/**
 * 🌊 Root Error Boundary
 * Catches errors in the root route group and renders a branded splashdeals error page.
 * Renders inside the root layout (html/body/ThemeProvider are provided by app/layout.tsx).
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("🌊 Root Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-block rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1">
            <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">
              Splash Error Detected
            </span>
          </div>
          <h1 className="text-4xl leading-none font-black tracking-tighter uppercase italic">
            Nešto Je <br /> Pošlo Naopako
          </h1>
          <p className="text-sm text-slate-400">
            Došlo je do neočekivane greške. Pokušajte ponovo ili se vratite na početnu stranicu.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => reset()}
            className="w-full bg-cyan-500 font-black text-slate-950 uppercase italic hover:bg-cyan-400"
          >
            <Icon name="refresh" className="mr-2 text-[16px]" />
            Pokušaj Ponovo
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-white/10 font-black text-white uppercase italic hover:bg-white/5"
          >
            <Link href="/">
              <Icon name="home" className="mr-2 text-[16px]" />
              Nazad na Početnu
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="font-mono text-[10px] tracking-widest text-slate-600 uppercase">
            Error Digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
