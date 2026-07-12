import { NextResponse } from "next/server";
import { purgeTrashedMediaAction } from "@/app/(server)/actions/cms-media";

/**
 * 🧹 POST /api/cron/purge-media
 *
 * Cron-triggered endpoint that permanently removes soft-deleted
 * media older than 30 days from both Vercel Blob and the database.
 *
 * Called daily by the system cron scheduler.
 */
export async function POST() {
  try {
    const result = await purgeTrashedMediaAction();

    if (result.success) {
      return NextResponse.json({
        success: true,
        purged: result.data?.purged ?? 0,
      });
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  } catch (error) {
    console.error("[cron/purge-media]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
