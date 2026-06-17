"use client"
import { Icon } from "@/components/ui/Icon";
import { useEffect } from "react"
import { GlassCard } from "@/components/ui/GlassCard"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Users Section Error:", error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <GlassCard className="max-w-xl w-full p-8 md:p-12 border-border/50 bg-background/50 relative z-10 text-center space-y-8">
        <div className="relative inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted/50 border border-border text-muted-foreground">
          <Icon name="gpp_maybe" className="size-10 stroke-[1.5]" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-foreground">
            Korisnici <span className="text-muted-foreground">Greška</span>
           </h1>
           <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              Došlo je do greške prilikom učitavanja korisnika.
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
            <Link href="/admin/users">
              <Icon name="arrow_back" className="size-4" />
              Nazad na korisnike
            </Link>
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
