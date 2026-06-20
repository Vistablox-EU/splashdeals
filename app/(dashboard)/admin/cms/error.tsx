"use client"

import { useEffect } from "react"
import { Icon } from "@/components/ui/Icon"

export default function CMSError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[CMS Error]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Icon name="error" className="size-12 text-destructive" />
      <h2 className="text-xl font-semibold">Došlo je do greške</h2>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        {error.message || "Neočekivana greška u CMS modulu."}
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Icon name="refresh" className="size-4" />
        Pokušaj ponovo
      </button>
    </div>
  )
}
