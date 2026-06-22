"use server"

import { prisma } from "@/server/lib/prisma"

export async function getFaqs(facilityId: string) {
  return prisma.facilityFAQ.findMany({
    where: { facilityId },
    orderBy: { displayOrder: "asc" },
  })
}

export async function createFaq(facilityId: string, question: string, answer: string) {
  const maxOrder = await prisma.facilityFAQ.aggregate({
    where: { facilityId },
    _max: { displayOrder: true },
  })
  return prisma.facilityFAQ.create({
    data: {
      facilityId,
      question,
      answer,
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  })
}

export async function updateFaq(id: string, data: { question?: string; answer?: string }) {
  return prisma.facilityFAQ.update({
    where: { id },
    data,
  })
}

export async function deleteFaq(id: string) {
  return prisma.facilityFAQ.delete({ where: { id } })
}

export async function reorderFaqs(items: { id: string; displayOrder: number }[]) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.facilityFAQ.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder },
      })
    )
  )
}