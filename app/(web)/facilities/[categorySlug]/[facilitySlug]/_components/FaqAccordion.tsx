"use client"

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

interface FAQItem {
  id: string
  question: string
  answer: string
}

interface Props {
  faqs: FAQItem[]
}

export function FaqAccordion({ faqs }: Props) {
  if (!faqs.length) return null

  return (
    <section className="space-y-6">
      <h2 className="text-3xl md:text-4xl font-black text-foreground italic tracking-tighter uppercase">
        Često postavljena pitanja
      </h2>
      <Accordion type="multiple" className="space-y-3">
        {faqs.map((faq) => (
          <AccordionItem
            key={faq.id}
            value={faq.id}
            className="rounded-xl border border-border bg-card px-6"
          >
            <AccordionTrigger className="text-left font-medium text-foreground py-4 hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4 whitespace-pre-wrap">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
