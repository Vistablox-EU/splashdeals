"use server"

import { z } from "zod"
import { prisma } from "@/server/lib/prisma"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import { processImageToWebP } from "@/server/lib/media"
import { validateAction } from "@/server/lib/actions/validator"
import { validateFacilityAccess, requireSuperAdmin } from "@/server/lib/auth-guards"
import { handleServerActionError } from "@/server/lib/server-action-error"
import { updateFacilityAmenitiesSchema } from "@/server/lib/validations/facility"

// ── Dead Code (removed) ──────────────────────────────────────
// copyAmenitiesFromFacilityAction, getFacilityAmenitiesAction,
// getOrphanedAmenitiesAction, purgeOrphanedAmenitiesAction,
// getAmenityHistoryAction were removed in June 2026.
// These were read-only server actions that had no callers.
// If needed in the future, implement as server components
// or API routes instead of server actions.
// ─────────────────────────────────────────────────────────────

const deleteGlobalAmenitySchema = z.object({
  amenityId: z.string(),
  facilityId: z.string(),
})

const uploadAmenityImageSchema = z.object({
  facilityId: z.string(),
  amenityId: z.string(),
})

/**
 * Delete a custom amenity from the global registry.
 */
export async function deleteGlobalAmenityAction(amenityId: string, facilityId: string) {
  try {
    const validation = await validateAction(deleteGlobalAmenitySchema, { amenityId, facilityId })
    if (!validation.success) throw new Error(validation.error)

    await validateFacilityAccess(facilityId)

    const amenity = await prisma.amenity.findUnique({
      where: { id: amenityId },
      select: { isSeeded: true }
    })

    if (!amenity) throw new Error("Amenity not found")
    if (amenity.isSeeded) throw new Error("Cannot delete seeded infrastructure")

    await prisma.amenity.delete({
      where: { id: amenityId }
    })

    revalidatePath(`/admin/facilities/${facilityId}/amenities`)
    return { success: true }
  } catch (error) {
    return handleServerActionError(error, "amenity-actions")
  }
}

/**
 * Bulk update facility amenities.
 */
export async function updateFacilityAmenitiesAction(
  facilityId: string, 
  data: z.infer<typeof updateFacilityAmenitiesSchema>["amenities"],
  lastUpdatedAt?: string | null
) {
  try {
    const validation = await validateAction(updateFacilityAmenitiesSchema, { facilityId, amenities: data, lastUpdatedAt })
    if (!validation.success) throw new Error(validation.error)
    
    await validateFacilityAccess(facilityId)
    const userId = validation.userId

    if (lastUpdatedAt) {
      const latest = await prisma.facilityAmenity.findMany({
        where: { facilityId },
        select: { updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      })
      
      const lastAmenityUpdate = latest[0]?.updatedAt?.toISOString()
      if (lastAmenityUpdate && lastAmenityUpdate !== lastUpdatedAt) {
        throw new Error("CONFLICT: Amenities were modified by another admin while you were editing. Please refresh and try again.")
      }
    }

    const currentAmenities = await prisma.facilityAmenity.findMany({
      where: { facilityId }
    })

    await prisma.$transaction(async (tx) => {
      for (const item of validation.data.amenities) {
        const existing = currentAmenities.find(a => a.amenityId === item.amenityId)
        let finalAmenityId = item.amenityId;

        if (item.isNew && item.name) {
          const newAmenity = await tx.amenity.create({
            data: {
              name: item.name,
              icon: item.icon || "Sparkles",
              category: item.category || "General",
              type: item.type || "BOOLEAN"
            }
          });
          finalAmenityId = newAmenity.id;
        }

        const auditEntries: { action: string, oldValue?: string | null, newValue?: string | null }[] = []

        if (item.checked) {
          if (!existing) {
            auditEntries.push({ action: "ENABLE", newValue: item.value || "ACTIVE" })
          } else {
            if (existing.value !== item.value) {
              auditEntries.push({ action: "VALUE_CHANGE", oldValue: existing.value, newValue: item.value })
            }
            if (existing.scheduledAt?.toISOString() !== item.scheduledAt) {
              auditEntries.push({ action: "SCHEDULE", oldValue: existing.scheduledAt?.toISOString(), newValue: item.scheduledAt })
            }
            if (existing.isFeatured !== item.isFeatured) {
              auditEntries.push({ action: "PROMOTION", oldValue: existing.isFeatured ? "FEATURED" : "STANDARD", newValue: item.isFeatured ? "FEATURED" : "STANDARD" })
            }
          }

          await tx.facilityAmenity.upsert({
            where: {
              facilityId_amenityId: {
                facilityId,
                amenityId: finalAmenityId,
              }
            },
            update: { 
              value: item.value,
              displayOrder: item.displayOrder ?? 0,
              imageUrl: item.imageUrl,
              scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
              isFeatured: item.isFeatured ?? false,
              isActive: true,
              updatedAt: new Date()
            },
            create: {
              facilityId,
              amenityId: finalAmenityId,
              value: item.value,
              displayOrder: item.displayOrder ?? 0,
              imageUrl: item.imageUrl,
              scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
              isFeatured: item.isFeatured ?? false,
              isActive: true
            }
          })
        } else if (existing) {
          auditEntries.push({ action: "DISABLE", oldValue: existing.value || "ACTIVE" })
          await tx.facilityAmenity.delete({
            where: {
              facilityId_amenityId: {
                facilityId,
                amenityId: finalAmenityId,
              }
            }
          })
        }

        if (auditEntries.length > 0) {
          await tx.amenityAuditLog.createMany({
            data: auditEntries.map(entry => ({
              targetFacilityId: facilityId,
              amenityId: finalAmenityId,
              userId,
              ...entry
            }))
          })
        }
      }
    })

    revalidatePath(`/admin/facilities/${facilityId}/amenities`)
    return { success: true }
  } catch (error) {
    return handleServerActionError(error, "amenity-actions")
  }
}

/**
 * High-fidelity image upload for amenities.
 */
export async function uploadAmenityImageAction(facilityId: string, amenityId: string, formData: FormData) {
  try {
    const validation = await validateAction(uploadAmenityImageSchema, { facilityId, amenityId })
    if (!validation.success) throw new Error(validation.error)

    await validateFacilityAccess(facilityId)

    const file = formData.get("file") as File
    if (!file) throw new Error("No asset provided")

    const buffer = await file.arrayBuffer()
    const optimized = await processImageToWebP(Buffer.from(buffer))
    
    const blob = await put(`amenities/${facilityId}/${amenityId}-${Date.now()}.webp`, optimized, {
      access: "public",
      contentType: "image/webp"
    })

    await prisma.facilityAmenity.update({
      where: {
        facilityId_amenityId: { facilityId, amenityId }
      },
      data: { imageUrl: blob.url }
    })

    return { success: true, url: blob.url }
  } catch (error) {
    return handleServerActionError(error, "amenity-actions")
  }
}

/**
 * Cron Action: Process scheduled amenity activations.
 * Flips amenities from 'Scheduled' to 'Active' status once their time has come.
 */
export async function processScheduledAmenitiesAction() {
  try {
    const now = new Date()

    // 1. Find all amenities scheduled to activate at or before now
    const toActivate = await prisma.facilityAmenity.findMany({
      where: {
        scheduledAt: {
          lte: now
        }
      }
    })

    if (toActivate.length === 0) {
      return { success: true, count: 0 }
    }

    // 2. Perform transaction to activate them, clear scheduledAt, and write audit logs
    const result = await prisma.$transaction(async (tx) => {
      // Update each amenity
      for (const item of toActivate) {
        await tx.facilityAmenity.update({
          where: {
            facilityId_amenityId: {
              facilityId: item.facilityId,
              amenityId: item.amenityId
            }
          },
          data: {
            isActive: true,
            scheduledAt: null
          }
        })

        // Log the activation audit trail
        await tx.amenityAuditLog.create({
          data: {
            targetFacilityId: item.facilityId,
            amenityId: item.amenityId,
            action: "ENABLE",
            oldValue: "SCHEDULED",
            newValue: item.value || "ACTIVE",
            userId: null // system process
          }
        })
      }

      return { success: true, count: toActivate.length }
    })

    return result
  } catch (error) {
    console.error("[processScheduledAmenities] Error:", error)
    return { success: false, count: 0, error: "Failed to process scheduled amenities" }
  }
}
