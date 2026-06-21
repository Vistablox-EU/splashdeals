"use client"
import { Icon } from "@/components/ui/Icon";

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function FacilitiesRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24 relative overflow-hidden bg-background">
      {/* Immersive ambient blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none" />

      <Card className="max-w-md w-full p-8 md:p-10 border-rose-500/20 bg-card/40 backdrop-blur-xl relative z-10 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tight text-foreground italic">
            Marketplace Offline
          </h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
            Došlo je do greške pri učitavanju kataloga ponuda. Pokušajte ponovo.
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Button
            onClick={() => reset()}
            className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-foreground font-black uppercase tracking-widest text-[11px] rounded-xl flex items-center justify-center gap-2"
          >
            <Icon name="undo" className="text-[16px]" />
            Pokušaj ponovo
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-11 border-border bg-muted/50 hover:bg-muted text-muted-foreground font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-1.5"
          >
            <Link href="/">
              <Icon name="home" className="text-[14px]" />
              Nazad na Početnu
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
