"use server";

import { prisma } from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { handleServerActionError, type ActionResult } from "@/server/lib/server-action-error";

/**
 * ⭐ Add a facility to the user's favorites.
 * Idempotent — if already favorited, no-op.
 */
export async function addFavoriteAction(
  facilityId: string,
): Promise<ActionResult<{ added: boolean }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    await prisma.userFavorite.upsert({
      where: {
        userId_facilityId: { userId: session.user.id, facilityId },
      },
      create: { userId: session.user.id, facilityId },
      update: {},
    });

    revalidatePath("/omiljeni");
    return { success: true, data: { added: true } };
  } catch (error) {
    return handleServerActionError(error, "addFavorite");
  }
}

/**
 * ⭐ Remove a facility from the user's favorites.
 */
export async function removeFavoriteAction(
  facilityId: string,
): Promise<ActionResult<{ removed: boolean }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    await prisma.userFavorite.delete({
      where: {
        userId_facilityId: { userId: session.user.id, facilityId },
      },
    });

    revalidatePath("/omiljeni");
    revalidatePath(`/${facilityId}`);
    return { success: true, data: { removed: true } };
  } catch (error) {
    return handleServerActionError(error, "removeFavorite");
  }
}
