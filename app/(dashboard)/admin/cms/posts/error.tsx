"use client"

import { useEffect } from "react"
import { Icon } from "@/components/ui/Icon"

export default function PostsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error("[Posts Error]", error) }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <Icon name="error" className="size-10 text-destructive" />
      <h2 className="text-lg font-semibold">Greška</h2>
      <p className="text-sm text-muted-foreground">{error.message || "Neočekivana greška."}</p>
      <button onClick={reset} className="text-sm text-primary hover:underline">Pokušaj ponovo</button>
    </div>
  )
}
