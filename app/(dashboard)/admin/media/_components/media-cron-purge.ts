import { purgeTrashedMediaAction } from "@/app/(server)/actions/cms-media";

/**
 * 🧹 CMS Media — Purge trashed items older than 30 days
 *
 * Called daily by the cron job. Soft-deleted CmsMedia records
 * older than 30 days are permanently removed from both the
 * database and Vercel Blob storage.
 *
 * Usage from cron:
 *   curl -X POST https://splashdeals.rs/api/cron/purge-media
 *
 * Or invoke directly:
 *   import { purgeTrashedMediaCron } from "@/app/(dashboard)/admin/media/_components/media-cron-purge"
 */
export async function purgeTrashedMediaCron(): Promise<{ purged: number }> {
  const result = await purgeTrashedMediaAction();
  if (result.success && result.data) {
    return { purged: result.data.purged };
  }
  console.error("[cms-media-purge]", result.error);
  return { purged: 0 };
}
