"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/GlassCard"

interface AmenitiesErrorProps {
  error: Error & { digest?: string }
  resetErrorBoundary: () => void
}

export function AmenitiesError({ error, resetErrorBoundary }: AmenitiesErrorProps) {
  React.useEffect(() => {
    // Proactively log to error tracking infrastructure
    console.error("Amenities Registry Component Boundary Exception:", error)
  }, [error])

  return (
    <GlassCard className="rounded-2xl border border-rose-500/20 bg-background/60 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center space-y-4 py-12">
      <div className="relative">
        <div className="absolute inset-0 bg-rose-500/10 blur-xl rounded-full scale-150 animate-pulse" />
        <div className="relative size-12 rounded-full border border-rose-500/30 bg-rose-500/10 flex items-center justify-center text-rose-400">
          <Icon name="gpp_maybe" className="size-6 animate-in zoom-in" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-foreground/90">Infrastructure Registry Failure</h3>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          A runtime database boundary exception or edge serialization error occurred while loading active assets.
        </p>
      </div>
      <Button
        type="button"
        onClick={resetErrorBoundary}
        className="h-8 px-4 bg-muted border border-border text-foreground/80 hover:text-foreground hover:bg-muted text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
      >
        <Icon name="undo" className="size-3" />
        <span>Reset & Retry</span>
      </Button>
    </GlassCard>
  )
}

export default AmenitiesError
