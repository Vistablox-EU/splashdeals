 
 
"use client"

import { SlotError } from "../_components/slot-error"

export default function TicketsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SlotError error={error} reset={reset} title="Tickets Catalog Error" />
}
