"use client"

import { useState, useEffect } from "react"

/**
 * Two-way sync between a URL search param and a sheet/modal open state.
 *
 * Usage:
 *   const { selectedItem, setSelectedItem, isOpen, setIsOpen } =
 *     useDeepLink(tickets, "editTicketId")
 *
 *   // Open sheet for a specific item:
 *   <TicketSheet open={isOpen} ticket={selectedItem} ... />
 */
export function useDeepLink<T extends { id: string }>(
  items: T[],
  paramName: string,
) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Open from URL param on mount / items change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const targetId = params.get(paramName)
    if (targetId) {
      const target = items.find((item) => item.id === targetId)
      if (target) {
        setSelectedItem(target)
        setIsOpen(true)
      }
    }
  }, [items, paramName])

  // Sync URL param with sheet state
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
