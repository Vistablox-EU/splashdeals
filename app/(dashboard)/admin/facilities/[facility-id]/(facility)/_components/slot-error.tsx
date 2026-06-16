"use client"
import { Icon } from "@/components/ui/Icon";

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

interface SlotErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
}

export function SlotError({ error, reset, title = "Segment failed to load" }: SlotErrorProps) {
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
        <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest">{title}</h3>
        <p className="text-xs text-slate-500 font-medium max-w-[200px]">
          Something went wrong while retrieving this data.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => reset()}
        className="h-8 border-red-500/20 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest"
      >
        <Icon name="undo" className="text-[12px] mr-2" />
        Retry Segment
      </Button>
    </div>
  )
}
