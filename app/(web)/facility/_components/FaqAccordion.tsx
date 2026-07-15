"use client";

import { useRef, useCallback, useState, useMemo } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export type FAQCategory = "ulaznice" | "boravak" | "pravila" | "lokacija";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
}

interface Props {
  faqs: FAQItem[];
}

const CATEGORY_ICONS: Record<FAQCategory, string> = {
  ulaznice: "confirmation_number",
  boravak: "home",
  pravila: "info",
  lokacija: "location_on",
};

const CATEGORY_LABELS: Record<FAQCategory, string> = {
  ulaznice: "Ulaznice",
  boravak: "Boravak",
  pravila: "Pravila",
  lokacija: "Lokacija",
};

const CATEGORY_ORDER: FAQCategory[] = ["ulaznice", "boravak", "pravila", "lokacija"];

const INITIAL_VISIBLE = 4;

function groupByCategory(faqs: FAQItem[]): Array<{ category: FAQCategory; items: FAQItem[] }> {
  const groups = new Map<FAQCategory, FAQItem[]>();
  for (const faq of faqs) {
    const list = groups.get(faq.category) ?? [];
    list.push(faq);
    groups.set(faq.category, list);
  }
  return CATEGORY_ORDER.filter((cat) => groups.has(cat)).map((cat) => ({
    category: cat,
    items: groups.get(cat)!,
  }));
}

export function FaqAccordion({ faqs }: Props) {
  const [showAllMobile, setShowAllMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevOpenRef = useRef<Set<string>>(new Set());

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const q = searchQuery.toLowerCase();
    return faqs.filter(
      (faq) => faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q),
    );
  }, [faqs, searchQuery]);

  const groupedFaqs = useMemo(() => groupByCategory(filteredFaqs), [filteredFaqs]);
  const hasActiveSearch = searchQuery.trim().length > 0;

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

      {/* Subtle search input */}
      <div className="relative">
        <Icon
          name="search"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          type="text"
          placeholder="Pretraži pitanja..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Pretraži pitanja"
          className="border-border/60 bg-card/80 h-11 pl-10 text-base md:text-sm"
        />
      </div>

      {groupedFaqs.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Nema rezultata za &ldquo;{searchQuery}&rdquo;
        </p>
      ) : (
        groupedFaqs.map(({ category, items }) => (
          <div key={category} className="space-y-3">
            {/* Category header with icon */}
            <div className="flex items-center gap-2 pb-1">
              <div className="bg-primary/10 flex size-7 items-center justify-center rounded-full">
                <Icon name={CATEGORY_ICONS[category]} className="text-primary size-4" />
              </div>
              <h3 className="text-foreground text-xs font-black tracking-[0.15em] uppercase">
                {CATEGORY_LABELS[category]}
              </h3>
            </div>

            <Accordion
              type="multiple"
              className="space-y-3"
              defaultValue={!hasActiveSearch ? [faqs[0].id] : undefined}
              onValueChange={handleValueChange}
            >
              {items.map((faq) => {
                const globalIndex = faqs.indexOf(faq);
                return (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className={cn(
                      "border-border bg-card brand-accent-left rounded-xl border px-4 sm:px-6",
                      !hasActiveSearch && globalIndex >= INITIAL_VISIBLE && "hidden md:block",
                      !hasActiveSearch &&
                        globalIndex >= INITIAL_VISIBLE &&
                        showAllMobile &&
                        "!block",
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
                );
              })}
            </Accordion>
          </div>
        ))
      )}

      {!hasActiveSearch && !showAllMobile && remaining > 0 && (
        <div className="pt-2 text-center md:hidden">
          <Button
            variant="outline"
            onClick={() => setShowAllMobile(true)}
            className="text-primary border-primary/20 h-11 min-h-11 px-4 text-sm font-bold"
          >
            Prikaži još {remaining} pitanja
          </Button>
        </div>
      )}

      <p className="text-muted-foreground pt-2 text-center text-sm">
        Niste pronašli odgovor?{" "}
        <Link
          href="/podrska"
          className="text-primary hover:text-primary/80 inline-flex min-h-11 items-center font-bold underline underline-offset-2 transition-colors"
        >
          Kontaktirajte nas
        </Link>
      </p>
    </section>
  );
}
