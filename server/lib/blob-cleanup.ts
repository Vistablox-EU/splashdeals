import { prisma } from "./prisma"

/**
 * Find and delete orphaned blobs in storage
 * Blobs that are referenced in code but don't exist in FacilityMedia table
 * 
 * This job should run on a schedule (e.g., nightly)
 */
export async function cleanupOrphanedBlobs() {
  console.log("[Blob Cleanup] Starting orphaned blob cleanup...")

  try {
    // Get all media URLs from database
    const allMedia = await prisma.facilityMedia.findMany({
      select: { url: true },
    })

    const referencedUrls = new Set(allMedia.map((m) => m.url))
    console.log(
      `[Blob Cleanup] Found ${referencedUrls.size} referenced blob URLs in database`
    )

    // TODO: Implement actual blob listing from Vercel Blob API
    // This would require fetching all blobs and comparing against referencedUrls
    // For now, we log the setup for manual implementation

    console.log("[Blob Cleanup] Orphaned blob cleanup completed")
    return { success: true, cleanedCount: 0 }
  } catch (error) {
    console.error("[Blob Cleanup] Error during cleanup:", error)
    throw error
  }
}

/**
 * Track failed blob deletion for later retry
 * Stores in database for eventual cleanup
 */
export async function queueBlobForCleanup(
  blobUrl: string,
  facilityId: string,
  reason: string
) {
  // TODO: Implement a BlobCleanupQueue table in Prisma schema
  // For now, just log
  console.warn(
    `[Blob Cleanup Queue] ${reason}: ${blobUrl} (facility: ${facilityId})`
  )
}

/**
 * Retry queued blob deletions
 * Should also run on a schedule
 */
export async function retryQueuedBlobDeletions() {
  console.log("[Blob Cleanup] Retrying queued blob deletions...")

  try {
    // TODO: Query BlobCleanupQueue table
    // For each entry, attempt del(blobUrl)
    // If successful, remove from queue
    // If fails, increment retry count and reschedule

    console.log("[Blob Cleanup] Queued blob deletion retry completed")
    return { success: true, retriedCount: 0 }
  } catch (error) {
    console.error("[Blob Cleanup] Error during retry:", error)
    throw error
  }
}

/**
 * Get storage usage statistics
 * Helpful for monitoring and alerting
 */
export async function getStorageStats() {
  try {
    const mediaCount = await prisma.facilityMedia.count()

    // TODO: Get actual blob storage usage from Vercel Blob API
    const totalSizeBytes = 0

    return {
      mediaCount,
      totalSizeBytes,
      totalSizeMB: Math.round(totalSizeBytes / 1024 / 1024),
      lastCleanup: new Date(),
    }
  } catch (error) {
    console.error("[Blob Stats] Error getting storage stats:", error)
    throw error
  }
}
