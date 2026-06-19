"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * Guards against losing unsaved form changes — combines
 * sheet-close interception + native beforeunload browser lock.
 */
export function useUnsavedChangesGuard(
  isDirty: boolean,
  onOpenChange: (open: boolean) => void,
) {
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)

  // ── Native browser lock (tab/refresh) ──────────────────────────────────
  useEffect(() => {
    const handlePreventLoss = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }
    window.addEventListener("beforeunload", handlePreventLoss)
    return () => window.removeEventListener("beforeunload", handlePreventLoss)
  }, [isDirty])

  // ── Sheet close interception ───────────────────────────────────────────
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && isDirty) {
        setShowUnsavedDialog(true)
        return
      }
      onOpenChange(newOpen)
    },
    [isDirty, onOpenChange],
  )

  const confirmDiscard = useCallback(() => {
    setShowUnsavedDialog(false)
    onOpenChange(false)
  }, [onOpenChange])

  return { showUnsavedDialog, setShowUnsavedDialog, handleOpenChange, confirmDiscard }
}
