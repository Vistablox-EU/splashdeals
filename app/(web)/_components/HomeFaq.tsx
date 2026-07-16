import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type HomeDict = Record<string, string>;

const FAQ_KEYS = [
  ["faq_1_q", "faq_1_a"],
  ["faq_2_q", "faq_2_a"],
  ["faq_3_q", "faq_3_a"],
  ["faq_4_q", "faq_4_a"],
  ["faq_5_q", "faq_5_a"],
  ["faq_6_q", "faq_6_a"],
] as const;

export function HomeFaq({ dict }: { dict: HomeDict }) {
  return (
    <section className="border-border mx-auto max-w-3xl border-t px-6 py-12 sm:py-16 md:px-12">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-black tracking-tighter uppercase italic sm:text-4xl">
          {dict.faq_title}
        </h2>
        <p className="text-muted-foreground text-sm">{dict.faq_subtitle}</p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {FAQ_KEYS.map(([q, a], i) => (
          <AccordionItem key={q} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-sm font-bold tracking-wide">
              {dict[q]}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
              {dict[a]}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
