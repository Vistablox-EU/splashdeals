"use client"

import { useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"

/**
 * Shared drag-and-drop sensor configuration used by both
 * ticket-panel (table rows) and group-panel (group cards).
 */
export function useDnDSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
}
