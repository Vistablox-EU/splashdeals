"use client";

import { useRef, useCallback, useState } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface Props {
  faqs: FAQItem[];
}

const INITIAL_VISIBLE = 4;

export function FaqAccordion({ faqs }: Props) {
  const [showAllMobile, setShowAllMobile] = useState(false);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevOpenRef = useRef<Set<string>>(new Set());

  const remaining = faqs.length - INITIAL_VISIBLE;

  const setItemRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  const handleValueChange = useCallback((openValues: string[]) => {
    const currentSet = new Set(openValues);
    for (const id of currentSet) {
      if (!prevOpenRef.current.has(id)) {
        const el = itemRefs.current.get(id);
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
    prevOpenRef.current = currentSet;
  }, []);

  if (!faqs.length) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-foreground text-2xl font-black tracking-tighter uppercase italic md:text-4xl">
        Često postavljena pitanja
      </h2>
      <Accordion
        type="multiple"
        className="space-y-3"
        defaultValue={[faqs[0].id]}
        onValueChange={handleValueChange}
      >
        {faqs.map((faq, index) => (
          <AccordionItem
            key={faq.id}
            value={faq.id}
            className={cn(
              "border-border bg-card brand-accent-left rounded-xl border px-4 sm:px-6",
              index >= INITIAL_VISIBLE && "hidden md:block",
              index >= INITIAL_VISIBLE && showAllMobile && "!block",
            )}
            ref={(el) => setItemRef(faq.id, el)}
          >
            <AccordionTrigger className="text-foreground py-4 text-left font-medium hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4 whitespace-pre-wrap">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {!showAllMobile && remaining > 0 && (
        <div className="pt-2 text-center md:hidden">
          <Button
            variant="link"
            onClick={() => setShowAllMobile(true)}
            className="text-primary text-sm font-bold"
          >
            Prikaži još {remaining} pitanja
          </Button>
        </div>
      )}

      <p className="text-muted-foreground pt-2 text-center text-sm">
        Niste pronašli odgovor?{" "}
        <Link
          href="/podrska"
          className="text-primary hover:text-primary/80 font-bold underline underline-offset-2 transition-colors"
        >
          Kontaktirajte nas
        </Link>
      </p>
    </section>
  );
}
