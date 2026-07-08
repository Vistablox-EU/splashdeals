import { prisma } from "@/server/lib/prisma"
import { FAQSectionList } from "./_components/faq-section-list"
import { connection } from "next/server"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ | Splashdeals Admin",
  description: "Upravljajte često postavljanim pitanjima za objekat.",
}

interface Props {
  params: Promise<{ "facility-id": string }>
}

export default async function FAQPage({ params }: Props) {
  await connection()
  const { "facility-id": facilityId } = await params

  const faqs = await prisma.facilityFAQ.findMany({
    where: { facilityId },
    orderBy: { displayOrder: "asc" },
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">FAQ</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pitanja i odgovori koji se prikazuju na javnoj stranici objekta.
        </p>
      </div>
      <FAQSectionList
        facilityId={facilityId}
        initialFaqs={faqs.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          displayOrder: f.displayOrder,
        }))}
      />
    </div>
  )
}
