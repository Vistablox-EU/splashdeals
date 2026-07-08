"use server"

import { z } from "zod"
import { del } from "@vercel/blob"
import { prisma } from "@/server/lib/prisma"
import { revalidatePath } from "next/cache"
import { handleServerActionError } from "@/server/lib/server-action-error"
import { validateAction } from "@/server/lib/actions/validator"
import { validateFacilityAccess } from "@/server/lib/auth-guards"

const bulkDeleteMediaSchema = z.object({
  facilityId: z.string().uuid(),
  mediaIds: z.array(z.string().uuid()).min(1).max(100),
})

export interface BulkDeleteResult {
  success: boolean
  deletedCount?: number
  failedCount?: number
  error?: string
}

/**
 * Bulk delete media items with transaction support
 * Ensures atomic operation: either all delete or none
 * 
 * This prevents the race condition where some items are deleted
 * from UI while others fail on the server.
 */
export async function bulkDeleteMediaAction(
  facilityId: string,
  mediaIds: string[]
): Promise<BulkDeleteResult> {
  try {
    const validation = await validateAction(bulkDeleteMediaSchema, {
      facilityId,
      mediaIds,
    })
    if (!validation.success) throw new Error(validation.error)

    await validateFacilityAccess(facilityId)

    // Fetch all media items in a single query
    const mediaItems = await prisma.facilityMedia.findMany({
      where: {
        id: { in: validation.data.mediaIds },
        facilityId,
      },
    })

    if (mediaItems.length === 0) {
      throw new Error("No media items found to delete")
    }

    // Verify all requested IDs were found (prevent orphaning)
    const foundIds = new Set(mediaItems.map((m) => m.id))
    const missingIds = validation.data.mediaIds.filter(
      (id) => !foundIds.has(id)
    )
    if (missingIds.length > 0) {
      throw new Error(
        `Some media items not found: ${missingIds.join(", ")}`
      )
    }

    // Use transaction to ensure atomic deletion
    const result = await prisma.$transaction(
      async (tx) => {
        const deletedIds: string[] = []
        const failedIds: string[] = []

        // Delete from database first (atomic operation)
        await tx.facilityMedia.deleteMany({
          where: { id: { in: validation.data.mediaIds } },
        })

        // Then delete from blob storage (can partially fail)
        // We don't abort if blob deletion fails - orphaned blobs
        // will be cleaned up by cleanup job
        for (const media of mediaItems) {
          try {
            await del(media.url)
            deletedIds.push(media.id)
          } catch (error) {
            console.error(
              `[Bulk Delete] Failed to delete blob ${media.url}:`,
              error
            )
            failedIds.push(media.id)
            // Continue with other blobs instead of throwing
          }
        }

        return { deletedIds, failedIds }
      },
      {
        maxWait: 10000, // 10 seconds
        timeout: 30000, // 30 seconds
      }
    )

    // Revalidate paths
    revalidatePath(`/admin/facilities/${facilityId}/media`)
    revalidatePath(`/facilities/[categorySlug]/[facilitySlug]`, "layout")

    if (result.failedIds.length > 0) {
      console.warn(
        `[Bulk Delete] ${result.failedIds.length} blob deletions failed (will be cleaned up later)`
      )
    }

    return {
      success: true,
      deletedCount: result.deletedIds.length,
      failedCount: result.failedIds.length,
    }
  } catch (error) {
    console.error("[Bulk Delete] Error:", error)
    return handleServerActionError(error, "bulkDeleteMedia")
  }
}
