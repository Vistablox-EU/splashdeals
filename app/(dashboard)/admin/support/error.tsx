"use client"
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button"
import { useEffect } from "react"
import Link from "next/link"

export default function SupportError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Support Error:", error)
  }, [error])

  return (
    <div className="flex flex-col gap-6 p-6 md:p-10 max-w-[1400px] w-full mx-auto">
      <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted/30 border border-border text-muted-foreground mx-auto">
        <Icon name="support_agent" className="text-[40px]" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black italic tracking-tighter uppercase text-foreground">
          Podrška <span className="text-muted-foreground">Greška</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Nije moguće učitati podršku. Molimo pokušajte ponovo.
        </p>
      </div>
      <div className="flex flex-col gap-3 max-w-sm mx-auto w-full pt-2">
        <Button
          onClick={reset}
          variant="outline"
          className="w-full px-8 py-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all"
        >
          <Icon name="refresh" className="text-[16px]" />
          Pokušaj ponovo
        </Button>
        <Link
          href="/admin/support"
          className="w-full px-8 py-4 rounded-xl bg-muted/80 hover:bg-foreground/10 text-foreground font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all"
        >
          <Icon name="support_agent" className="text-[16px]" />
          Podrška
        </Link>
      </div>
    </div>
  )
}
