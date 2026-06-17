"use client"
import { Icon } from "@/components/ui/Icon";

import { useEffect } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ForbiddenError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Forbidden Page Error:", error)
  }, [error])

  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-muted/10 rounded-full blur-[120px]" />
      </div>
      <GlassCard className="max-w-xl w-full p-8 md:p-12 border-border/50 bg-background/50 relative z-10 text-center space-y-8">
        <div className="relative inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted/50 border border-border text-muted-foreground">
          <Icon name="gpp_maybe" className="size-10 stroke-[1.5]" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-foreground">
            Access <br />
            <span className="text-muted-foreground">Error</span>
           </h1>
           <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              Došlo je do greške prilikom provere vaših dozvola. Molimo pokušajte ponovo.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={reset}
            variant="outline"
            className="font-black uppercase tracking-widest text-[10px] h-11 rounded-xl"
          >
            <Icon name="refresh" className="size-4" />
            Pokušaj ponovo
          </Button>
          <Button asChild variant="secondary" className="font-black uppercase tracking-widest text-[10px] h-11 rounded-xl">
            <Link href="/admin/dashboard">
              <Icon name="home" className="size-4" />
              Kontrolna tabla
            </Link>
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
