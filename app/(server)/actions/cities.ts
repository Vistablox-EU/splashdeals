"use server";

import { prisma } from "@/app/(server)/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/(server)/lib/auth-guards";

import { handleServerActionError } from "@/app/(server)/lib/server-action-error";

const citySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name is too short"),
  slug: z.string().min(2, "Slug is too short"),
  isDeleted: z.boolean().optional(),
});

const manageCitiesSchema = z.array(citySchema);

export async function manageCitiesAction(cities: z.infer<typeof manageCitiesSchema>) {
  try {
    await requireAdmin();
    const validated = manageCitiesSchema.parse(cities);

    await prisma.$transaction(async (tx) => {
      for (const city of validated) {
        if (city.isDeleted && city.id) {
          // 🛑 Delete city and its relationships
          await tx.city.delete({
            where: { id: city.id },
          });
          continue;
        }

        if (city.id) {
          // 🔄 Update existing city
          await tx.city.update({
            where: { id: city.id },
            data: {
              name: city.name,
              slug: city.slug.toLowerCase().replace(/\s+/g, "-"),
            },
          });
        } else if (!city.isDeleted) {
          // ✨ Create new city
          await tx.city.create({
            data: {
              name: city.name,
              slug: city.slug.toLowerCase().replace(/\s+/g, "-"),
            },
          });
        }
      }
    });

    revalidatePath("/admin/facilities", "layout");
    return { success: true };
  } catch (error: unknown) {
    return handleServerActionError(error, "cities");
  }
}
