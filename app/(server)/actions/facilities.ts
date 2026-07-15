"use server";

import { z } from "zod";
import { prisma } from "@/app/(server)/lib/prisma";
import { revalidateAdminFacilities } from "@/app/(server)/lib/revalidation";
import { FacilityStatus } from "@prisma/client";
import { facilitySchema, type FacilityFormValues } from "@/app/(server)/lib/validations/facility";
import { requireSuperAdmin } from "@/app/(server)/lib/auth-guards";

import { handleServerActionError } from "@/app/(server)/lib/server-action-error";

const bulkUpdateFacilityStatusSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1, "Nije izabran nijedan objekat")
    .max(100, "Maksimalno 100 objekata po akciji"),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "EMERGENCY_SHUTDOWN"]),
});

export async function bulkUpdateFacilityStatusAction(ids: string[], status: FacilityStatus) {
  try {
    await requireSuperAdmin();
    const validated = bulkUpdateFacilityStatusSchema.parse({ ids, status });

    await prisma.facility.updateMany({
      where: {
        id: { in: validated.ids },
      },
      data: {
        status: validated.status,
      },
    });

    revalidateAdminFacilities();
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "facilities");
  }
}

export async function createFacilityAction(data: FacilityFormValues) {
  try {
    const validatedFields = facilitySchema.parse(data);
    const { name, slug, category, city, cityId, streetName, streetNumber, postalCode, status } =
      validatedFields;

    await requireSuperAdmin();
    const facility = await prisma.facility.create({
      data: {
        name,
        slug,
        category,
        city,
        cityId: cityId || null,
        streetName,
        streetNumber,
        postalCode,
        status,
      },
    });

    revalidateAdminFacilities();
    return { success: true, id: facility.id };
  } catch (error: unknown) {
    return handleServerActionError(error, "facilities");
  }
}

export async function deleteFacilityAction(id: string) {
  try {
    await requireSuperAdmin();

    const transactionCount = await prisma.transaction.count({
      where: { facilityId: id },
    });

    if (transactionCount > 0) {
      return {
        success: false,
        error: `Objekat se ne može obrisati jer ima ${transactionCount} transakcija. Postavite status na ZATVOREN umesto brisanja.`,
      };
    }

    await prisma.facility.delete({
      where: { id },
    });

    revalidateAdminFacilities();
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "facilities");
  }
}
