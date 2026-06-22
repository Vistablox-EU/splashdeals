"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface Props {
  faqs: FAQItem[];
}

export function FaqAccordion({ faqs }: Props) {
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevOpenRef = useRef<Set<string>>(new Set());

  const setItemRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  const handleValueChange = useCallback(
    (openValues: string[]) => {
      const currentSet = new Set(openValues);
      // Find items that were just opened (in current but not in prev)
      for (const id of currentSet) {
        if (!prevOpenRef.current.has(id)) {
          const el = itemRefs.current.get(id);
          el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
      prevOpenRef.current = currentSet;
    },
    []
  );

  if (!faqs.length) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-2xl md:text-4xl font-black text-foreground italic tracking-tighter uppercase">
        Često postavljena pitanja
      </h2>
      <Accordion
        type="multiple"
        className="space-y-3"
        defaultValue={[faqs[0].id]}
        onValueChange={handleValueChange}
      >
        {faqs.map((faq) => (
          <AccordionItem
            key={faq.id}
            value={faq.id}
            className="rounded-xl border border-border bg-card px-4 sm:px-6 brand-accent-left"
            ref={(el) => setItemRef(faq.id, el)}
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

      {faqs.length > 0 && (
        <p className="text-sm text-muted-foreground text-center pt-2">
          Niste pronašli odgovor?{" "}
          <Link
            href="/podrska"
            className="text-primary font-bold underline underline-offset-2 hover:text-cyan-300 transition-colors"
          >
            Kontaktirajte nas
          </Link>
        </p>
      )}
    </section>
  );
}
