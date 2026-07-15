"use server";

import { prisma } from "@/app/(server)/lib/prisma";
import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { revalidatePath } from "next/cache";

export async function listFacilityOwnersAction(facilityId: string) {
  try {
    await requireAdmin();
    const rows = await prisma.facilityOwner.findMany({
      where: { facilityId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    return {
      success: true as const,
      data: rows.map((r) => ({
        userId: r.userId,
        email: r.user.email,
        name: r.user.name,
      })),
    };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Greška pri učitavanju vlasnika",
    };
  }
}

export async function assignFacilityOwnerAction(facilityId: string, email: string) {
  try {
    await requireAdmin();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return { success: false as const, error: "Korisnik sa tim emailom nije pronađen" };
    await prisma.facilityOwner.upsert({
      where: { userId_facilityId: { userId: user.id, facilityId } },
      create: { userId: user.id, facilityId },
      update: {},
    });
    revalidatePath(`/admin/facilities/${facilityId}/profile`);
    return { success: true as const };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Greška pri dodeli vlasnika",
    };
  }
}

export async function removeFacilityOwnerAction(facilityId: string, userId: string) {
  try {
    await requireAdmin();
    await prisma.facilityOwner.delete({
      where: { userId_facilityId: { userId, facilityId } },
    });
    revalidatePath(`/admin/facilities/${facilityId}/profile`);
    return { success: true as const };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Greška pri uklanjanju",
    };
  }
}
