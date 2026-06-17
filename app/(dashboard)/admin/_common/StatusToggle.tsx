"use client"

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

import { useTransition } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { FacilityStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { updateFacilityStatusAction } from "@/server/actions/governance"

interface StatusToggleProps {
  facilityId: string
  status: FacilityStatus
  compact?: boolean
}

export function StatusToggle({ facilityId, status, compact }: StatusToggleProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const toggleStatus = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const nextStatus = status === "ACTIVE" ? "DRAFT" : "ACTIVE"
    
    startTransition(async () => {
      const result = await updateFacilityStatusAction({
        facilityId,
        status: nextStatus as "DRAFT" | "ACTIVE" | "CLOSED" | "EMERGENCY_SHUTDOWN"
      })

      if (result.success) {
        toast.success(`Facility is now ${nextStatus}`)
        router.refresh()
      } else {
        toast.error(result.error || "Transition failed")
      }
    })
  }

  if (status !== "DRAFT" && status !== "ACTIVE") {
    return (
      <div className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-[0.15em]",
        status === "EMERGENCY_SHUTDOWN" ? "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.1)]" :
        "bg-muted/10 text-muted-foreground border-muted/20"
      )}>
        {status}
      </div>
    )
  }

  if (compact) {
    return (
      <button
        disabled={isPending}
        onClick={toggleStatus}
        className={cn(
          "group relative inline-flex items-center px-2.5 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300",
          status === "ACTIVE" 
            ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_12px_rgba(6,182,212,0.1)] hover:bg-primary/20" 
            : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
        )}
      >
        <span className="flex items-center gap-1.5">
          {isPending ? (
            <Icon name="progress_activity" className="text-[12px] animate-spin" />
          ) : status === "ACTIVE" ? (
            <Icon name="bolt" className="text-[12px] text-primary" />
          ) : (
            <Icon name="bolt" className="text-[12px] text-amber-500" />
          )}
          {status}
        </span>
        
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-muted border border-border rounded text-[8px] font-bold text-foreground opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          Click to {status === "ACTIVE" ? "Set Draft" : "Go Live"}
        </div>
      </button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={toggleStatus}
      className="gap-2 border-border/50 bg-muted/10 hover:bg-muted/30 transition-all text-[10px] font-black uppercase tracking-widest h-8"
    >
      {isPending ? (
        <Icon name="progress_activity" className="text-[12px] animate-spin" />
      ) : status === "ACTIVE" ? (
        <Icon name="bolt" className="text-[12px] text-amber-500" />
      ) : (
        <Icon name="bolt" className="text-[12px] text-emerald-500" />
      )}
      {status === "ACTIVE" ? "Set to Draft" : "Go Live"}
    </Button>
  )
}


