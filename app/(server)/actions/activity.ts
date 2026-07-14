"use server";

import { prisma } from "@/app/(server)/lib/prisma";
import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { handleServerActionError, type ActionResult } from "@/app/(server)/lib/server-action-error";

/**
 * 🪵 Log a CMS activity entry.
 */
export async function logActivity(
  userId: string,
  action: string,
  entityId?: string | null,
  entityType?: string | null,
  metadata?: Record<string, unknown> | null,
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityId: entityId ?? undefined,
        entityType: entityType ?? undefined,
        metadata: (metadata as any) ?? undefined,
      },
    });
  } catch (error) {
    // Log activity failures should never block the main operation
    console.error("Failed to log activity:", error);
  }
}

/**
 * 📋 Get recent activity log entries.
 */
export async function getActivityLogAction(
  limit = 100,
): Promise<ActionResult<Array<Record<string, unknown>>>> {
  try {
    await requireAdmin();

    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 500),
    });

    return { success: true, data: logs as unknown as Array<Record<string, unknown>> };
  } catch (error) {
    return handleServerActionError(error, "activity/getActivityLog");
  }
}
