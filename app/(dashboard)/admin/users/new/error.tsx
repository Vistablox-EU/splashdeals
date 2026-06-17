"use client"
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button"

import { useEffect } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import Link from "next/link"

export default function NewUserError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("New User Error:", error)
  }, [error])

  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-muted/10 rounded-full blur-[120px]" />
      </div>
      <GlassCard className="max-w-xl w-full p-8 md:p-12 border-border/50 bg-background/50 relative z-10 text-center space-y-8">
        <div className="relative inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted/50 border border-border text-muted-foreground">
          <Icon name="gpp_maybe" className="text-[40px] stroke-[1.5]" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-foreground">
            User <br />
            <span className="text-muted-foreground">Greška prilikom kreiranja</span>
           </h1>
           <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              Došlo je do greške prilikom kreiranja administratora. Molimo pokušajte ponovo.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={reset}
            variant="outline"
            className="w-full px-8 py-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all"
          >
            <Icon name="refresh" className="text-[16px]" />
            Pokušaj ponovo
          </Button>
          <Link
            href="/admin/users"
            className="w-full px-8 py-4 rounded-xl bg-muted/80 hover:bg-white text-foreground font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all"
          >
            <Icon name="arrow_back" className="text-[16px]" />
            Nazad na korisnike
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
