 
 
"use client"

import { SlotError } from "../_components/slot-error"

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SlotError error={error} reset={reset} title="Profile Segment Error" />
}
