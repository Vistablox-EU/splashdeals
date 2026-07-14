"use server";

import { z } from "zod";
import { prisma } from "@/app/(server)/lib/prisma";
import { handleServerActionError } from "@/app/(server)/lib/server-action-error";
import { validateFacilityAccess } from "@/app/(server)/lib/auth-guards";
import { revalidateAdminFacility } from "@/app/(server)/lib/revalidation";

const closureSchema = z.object({
  facilityId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().max(200).nullish(),
});

export async function addFacilityClosureAction(data: z.infer<typeof closureSchema>) {
  try {
    const validated = closureSchema.parse(data);
    await validateFacilityAccess(validated.facilityId);
    const closure = await prisma.facilityClosure.create({
      data: {
        facilityId: validated.facilityId,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        reason: validated.reason || "Scheduled maintenance or blackout period",
      },
    });

    revalidateAdminFacility(validated.facilityId);
    return { success: true, data: closure };
  } catch (error) {
    return handleServerActionError(error, "closures");
  }
}

export async function removeFacilityClosureAction(closureId: string, facilityId: string) {
  try {
    await validateFacilityAccess(facilityId);
    await prisma.facilityClosure.delete({
      where: { id: closureId },
    });

    revalidateAdminFacility(facilityId);
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "closures");
  }
}
