"use client"
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button"
import { useEffect } from "react"
import Link from "next/link"

export default function FacilitiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Facilities Error:", error)
  }, [error])

  return (
    <div className="relative min-h-[60vh] flex items-center justify-center p-6">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-md w-full p-8 text-center space-y-6 relative z-10">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted/30 border border-border text-muted-foreground">
          <Icon name="gpp_maybe" className="text-[40px]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-foreground">
            Objekti <span className="text-muted-foreground">Greška</span>
           </h1>
           <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Nije moguće učitati listu objekata. Molimo pokušajte ponovo.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={reset}
            variant="outline"
            className="w-full px-8 py-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all"
          >
            <Icon name="refresh" className="text-[16px]" />
            Pokušaj ponovo
          </Button>
          <Button asChild variant="secondary" className="w-full px-8 py-4 rounded-xl bg-muted/80 hover:bg-white text-foreground font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all">
            <Link href="/admin/facilities">
              <Icon name="apartment" className="text-[16px]" />
              Svi objekti
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
