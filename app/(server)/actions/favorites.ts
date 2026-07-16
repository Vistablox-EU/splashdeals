"use server";

import { prisma } from "@/app/(server)/lib/prisma";
import { auth } from "@/app/(server)/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { handleServerActionError, type ActionResult } from "@/app/(server)/lib/server-action-error";
import { requireAuth } from "@/app/(server)/lib/auth-guards";
import { z } from "zod";

async function revalidateFavoriteSurfaces(facilityId: string) {
  revalidatePath("/omiljeni");
  revalidatePath("/nalog");
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { slug: true, category: true },
  });
  if (facility?.slug) {
    revalidatePath(`/${facility.slug}`, "layout");
  }
}

/**
 * Batch favorite status for listing grids (server components).
 */
export async function getFavoritedFacilityIds(facilityIds: string[]): Promise<Set<string>> {
  if (facilityIds.length === 0) return new Set();
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return new Set();
    const rows = await prisma.userFavorite.findMany({
      where: {
        userId: session.user.id,
        facilityId: { in: facilityIds },
      },
      select: { facilityId: true },
    });
    return new Set(rows.map((r) => r.facilityId));
  } catch {
    return new Set();
  }
}

/**
 * ⭐ Add a facility to the user's favorites.
 * Idempotent — if already favorited, no-op.
 */
export async function addFavoriteAction(
  facilityId: string,
): Promise<ActionResult<{ added: boolean; facilitySlug?: string }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true, slug: true },
    });
    if (!facility) {
      return { success: false, error: "Objekat nije pronađen." };
    }

    await prisma.userFavorite.upsert({
      where: {
        userId_facilityId: { userId: session.user.id, facilityId },
      },
      create: { userId: session.user.id, facilityId },
      update: {},
    });

    await revalidateFavoriteSurfaces(facilityId);
    return { success: true, data: { added: true, facilitySlug: facility.slug } };
  } catch (error) {
    return handleServerActionError(error, "addFavorite");
  }
}

/**
 * ⭐ Remove a facility from the user's favorites.
 */
export async function removeFavoriteAction(
  facilityId: string,
): Promise<ActionResult<{ removed: boolean; facilitySlug?: string }>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: "Morate biti prijavljeni." };
    }

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { id: true, slug: true },
    });

    await prisma.userFavorite.delete({
      where: {
        userId_facilityId: { userId: session.user.id, facilityId },
      },
    });

    await revalidateFavoriteSurfaces(facilityId);
    return {
      success: true,
      data: { removed: true, facilitySlug: facility?.slug },
    };
  } catch (error) {
    return handleServerActionError(error, "removeFavorite");
  }
}

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ime mora imati najmanje 2 karaktera")
    .max(80, "Ime može imati najviše 80 karaktera"),
});

/**
 * Update buyer display name on /nalog.
 */
export async function updateProfileNameAction(
  rawName: string,
): Promise<ActionResult<{ name: string }>> {
  try {
    const user = await requireAuth();
    const { name } = updateProfileSchema.parse({ name: rawName });

    await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });

    revalidatePath("/nalog");
    revalidatePath("/moje-karte");
    return { success: true, data: { name } };
  } catch (error) {
    return handleServerActionError(error, "updateProfileName");
  }
}
