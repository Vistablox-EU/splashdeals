"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/lib/prisma";

export async function getFaqs(facilityId: string) {
  return prisma.facilityFAQ.findMany({
    where: { facilityId },
    orderBy: { displayOrder: "asc" },
  });
}

export async function createFaq(facilityId: string, question: string, answer: string) {
  const maxOrder = await prisma.facilityFAQ.aggregate({
    where: { facilityId },
    _max: { displayOrder: true },
  });
  const faq = await prisma.facilityFAQ.create({
    data: {
      facilityId,
      question,
      answer,
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  });
  revalidatePath(`/admin/facilities/${facilityId}/faq`);
  return faq;
}

export async function updateFaq(id: string, data: { question?: string; answer?: string }) {
  const faq = await prisma.facilityFAQ.update({
    where: { id },
    data,
  });
  revalidatePath(`/admin/facilities/${faq.facilityId}/faq`);
  return faq;
}

export async function deleteFaq(id: string) {
  const faq = await prisma.facilityFAQ.findUniqueOrThrow({ where: { id } });
  await prisma.facilityFAQ.delete({ where: { id } });
  revalidatePath(`/admin/facilities/${faq.facilityId}/faq`);
}

export async function reorderFaqs(items: { id: string; displayOrder: number }[]) {
  const first = await prisma.facilityFAQ.findUniqueOrThrow({ where: { id: items[0].id } });
  await prisma.$transaction(
    items.map((item) =>
      prisma.facilityFAQ.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder },
      }),
    ),
  );
  revalidatePath(`/admin/facilities/${first.facilityId}/faq`);
}
