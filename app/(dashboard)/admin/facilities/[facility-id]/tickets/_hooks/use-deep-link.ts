"use client"

import { useState, useEffect } from "react"

/**
 * Two-way sync between a URL search param and a sheet/modal open state.
 *
 * Reads the URL param on first render (lazy initializer, no effect needed),
 * then syncs URL ← sheet state on changes.
 *
 * Usage:
 *   const { selectedItem, setSelectedItem, isOpen, setIsOpen } =
 *     useDeepLink(tickets, "editTicketId")
 */
export function useDeepLink<T extends { id: string }>(
  items: T[],
  paramName: string,
) {
  const [selectedItem, setSelectedItem] = useState<T | null>(() => {
    if (typeof window === "undefined") return null
    const params = new URLSearchParams(window.location.search)
    const targetId = params.get(paramName)
    return targetId ? items.find((item) => item.id === targetId) ?? null : null
  })

  // Derive initial open state from the URL param
  const [isOpen, setIsOpen] = useState(() => !!selectedItem)

  // Sync URL param with sheet state (this is a side effect but it's
  // writing to the URL bar, not triggering cascading renders)
  useEffect(() => {
    const currentUrl = new URL(window.location.href)
    if (isOpen && selectedItem?.id) {
      currentUrl.searchParams.set(paramName, selectedItem.id)
    } else if (!isOpen) {
      currentUrl.searchParams.delete(paramName)
    }
    window.history.replaceState({ ...window.history.state }, "", currentUrl.toString())
  }, [isOpen, selectedItem, paramName])

  return { selectedItem, setSelectedItem, isOpen, setIsOpen }
}
