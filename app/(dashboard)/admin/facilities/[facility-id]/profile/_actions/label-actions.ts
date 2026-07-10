"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/lib/prisma";

export async function searchPlaces(query: string) {
  if (!query || query.length < 2) return [];
  return prisma.populatedPlace.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    take: 10,
  });
}

export async function getFacilityLabels(facilityId: string) {
  return prisma.facilityLabel.findMany({
    where: { facilityId },
    include: { place: true },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

export async function addLabel(facilityId: string, placeId: string) {
  const exists = await prisma.facilityLabel.findUnique({
    where: { facilityId_placeId: { facilityId, placeId } },
  });
  if (exists) return exists;
  const label = await prisma.facilityLabel.create({
    data: { facilityId, placeId },
    include: { place: true },
  });
  revalidatePath(`/admin/facilities/${facilityId}/profile`);
  return label;
}

export async function removeLabel(id: string) {
  const label = await prisma.facilityLabel.findUniqueOrThrow({
    where: { id },
    select: { facilityId: true },
  });
  await prisma.facilityLabel.delete({ where: { id } });
  revalidatePath(`/admin/facilities/${label.facilityId}/profile`);
}

export async function updateLabel(id: string, data: { label?: string; isPrimary?: boolean }) {
  const label = await prisma.facilityLabel.findUniqueOrThrow({
    where: { id },
    select: { facilityId: true },
  });
  const updated = await prisma.facilityLabel.update({
    where: { id },
    data,
    include: { place: true },
  });
  revalidatePath(`/admin/facilities/${label.facilityId}/profile`);
  return updated;
}

export async function setPrimaryLabel(facilityId: string, labelId: string) {
  // Unset all primary for this facility, then set the chosen one
  await prisma.facilityLabel.updateMany({
    where: { facilityId, isPrimary: true },
    data: { isPrimary: false },
  });
  const result = await prisma.facilityLabel.update({
    where: { id: labelId },
    data: { isPrimary: true },
    include: { place: true },
  });
  revalidatePath(`/admin/facilities/${facilityId}/profile`);
  return result;
}
