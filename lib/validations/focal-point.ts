import { z } from "zod"

/**
 * Focal point validation schema for image coordinates
 * Stores as JSON object with x, y percentages (0-100)
 */
export const focalPointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
}).nullable()

export type FocalPoint = z.infer<typeof focalPointSchema>

/**
 * Safely parse focal point from string or JSON
 * @param input - Could be "50,50" (legacy), JSON string, or object
 * @returns Parsed focal point or null
 */
export function parseFocalPoint(input: unknown): FocalPoint {
  if (input === null || input === undefined) return null

  // Already an object
  if (typeof input === "object") {
    const result = focalPointSchema.safeParse(input)
    return result.success ? result.data : null
  }

  // String format
  if (typeof input === "string") {
    // Try JSON first
    try {
      const parsed = JSON.parse(input)
      const result = focalPointSchema.safeParse(parsed)
      return result.success ? result.data : null
    } catch {
      // Fall back to legacy "x,y" format
      const [x, y] = input.split(",").map((v) => parseFloat(v.trim()))
      if (!isNaN(x) && !isNaN(y)) {
        const result = focalPointSchema.safeParse({ x, y })
        return result.success ? result.data : null
      }
    }
  }

  return null
}

/**
 * Format focal point for CSS positioning
 * @param focalPoint - Focal point object
 * @returns Object with left and top CSS values
 */
export function formatFocalPointForCSS(
  focalPoint: FocalPoint
): { left: string; top: string } | null {
  if (!focalPoint) return null

  return {
    left: `${focalPoint.x}%`,
    top: `${focalPoint.y}%`,
  }
}

/**
 * Serialize focal point to JSON for database storage
 */
export function serializeFocalPoint(focalPoint: FocalPoint): string | null {
  if (!focalPoint) return null
  return JSON.stringify(focalPoint)
}
