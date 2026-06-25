import { NextResponse } from "next/server"
import { prisma } from "@/server/lib/prisma"
import { authenticateRequest } from "@/server/lib/api-key-auth"
import { requireSuperAdmin } from "@/server/lib/auth-guards"
import { handleServerActionError } from "@/server/lib/server-action-error"
import { z } from "zod/v4"

/**
 * 🏢 Facility Pricing API — Read & Update Ticket Prices
 *
 * GET  — Returns the full ticket hierarchy (categories → products → prices)
 *        for agent diffing. Includes inactive entries so the agent sees everything.
 *
 * PATCH — Bulk-update ticket prices by ID. Each price update is validated
 *         individually; unknown or invalid IDs are skipped (not rejected).
 */

// ─── Schemas ────────────────────────────────────────────────

const priceUpdateSchema = z.object({
  id: z.string(),
  label: z.string().optional().nullable(),
  price: z.coerce.number().min(0, "Cena mora biti pozitivna"),
  originalPrice: z.coerce.number().min(0).optional().nullable(),
  dayType: z.enum(["ALL", "WEEKDAY", "WEEKEND", "HOLIDAY"]).optional(),
  timeSlot: z.enum(["FULL_DAY", "MORNING", "AFTERNOON", "EVENING"]).optional(),
  validFrom: z.string().datetime().optional().nullable(),
  validTo: z.string().datetime().optional().nullable(),
  saleStart: z.string().datetime().optional().nullable(),
  saleEnd: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
})

const bulkPricingSchema = z.object({
  prices: z.array(priceUpdateSchema).min(1, "Bar jedna cena je obavezna"),
})

// ─── GET ────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: facilityId } = await params

    const categories = await prisma.ticketCategory.findMany({
      where: { facilityId },
      orderBy: { displayOrder: "asc" },
      include: {
        types: {
          orderBy: { displayOrder: "asc" },
          include: {
            prices: {
              orderBy: { displayOrder: "asc" },
            },
          },
        },
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    const result = handleServerActionError(error)
    return NextResponse.json(result, { status: result.error ? 400 : 500 })
  }
}

// ─── PATCH ──────────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authenticateRequest(request).catch(() => requireSuperAdmin())
    const { id: facilityId } = await params

    const json = await request.json()
    const validated = bulkPricingSchema.parse(json)

    // Verify facility exists
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true },
    })
    if (!facility) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 })
    }

    // Update each price individually — skip IDs that don't exist
    const results: { id: string; updated: boolean; error?: string }[] = []

    for (const update of validated.prices) {
      try {
        // Verify price belongs to this facility (through category → product chain)
        const existing = await prisma.ticketPrice.findFirst({
          where: {
            id: update.id,
            ticketType: {
              category: { facilityId },
            },
          },
          select: { id: true },
        })

        if (!existing) {
          results.push({ id: update.id, updated: false, error: "Not found or belongs to another facility" })
          continue
        }

        // Build update payload — only include present fields
        const data: Record<string, unknown> = {}
        if (update.label !== undefined) data.label = update.label
        if (update.price !== undefined) data.price = update.price
        if (update.originalPrice !== undefined) data.originalPrice = update.originalPrice
        if (update.dayType !== undefined) data.dayType = update.dayType
        if (update.timeSlot !== undefined) data.timeSlot = update.timeSlot
        if (update.validFrom !== undefined) data.validFrom = update.validFrom
        if (update.validTo !== undefined) data.validTo = update.validTo
        if (update.saleStart !== undefined) data.saleStart = update.saleStart
        if (update.saleEnd !== undefined) data.saleEnd = update.saleEnd
        if (update.isActive !== undefined) data.isActive = update.isActive
        if (update.displayOrder !== undefined) data.displayOrder = update.displayOrder

        await prisma.ticketPrice.update({
          where: { id: update.id },
          data,
        })

        results.push({ id: update.id, updated: true })
      } catch (error) {
        results.push({
          id: update.id,
          updated: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.filter((r) => r.updated).length,
      failed: results.filter((r) => !r.updated).length,
      results,
    })
  } catch (error) {
    const result = handleServerActionError(error)
    return NextResponse.json(result, { status: result.error ? 400 : 500 })
  }
}
