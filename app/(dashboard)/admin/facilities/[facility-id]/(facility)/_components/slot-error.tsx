"use client"
import { Icon } from "@/components/ui/Icon";

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface SlotErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
}

export function SlotError({ error, reset, title = "Segment nije učitan" }: SlotErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(`[Slot Error] ${title}:`, error)
  }, [error, title])

  return (
    <div className="flex flex-col items-center justify-center p-8 border border-red-500/10 bg-red-500/5 rounded-2xl space-y-4">
      <div className="p-3 bg-red-500/10 rounded-full">
        <Icon name="error" className="text-[24px] text-red-500" />
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{title}</h3>
        <p className="text-xs text-muted-foreground font-medium max-w-[200px]">
          Došlo je do greške prilikom učitavanja podataka.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => reset()}
          className="h-8 border-red-500/20 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest"
        >
          <Icon name="undo" className="text-[12px] mr-2" />
          Pokušaj ponovo
        </Button>
        <Button variant="outline" size="sm" asChild className="h-8 border-border/50 text-[10px] font-black uppercase tracking-widest">
          <Link href=".">
            <Icon name="keyboard_arrow_left" className="text-[12px] mr-2" />
            Nazad na pregled
          </Link>
        </Button>
      </div>
    </div>
  )
}
