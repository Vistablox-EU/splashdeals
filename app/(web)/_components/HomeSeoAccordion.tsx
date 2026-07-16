import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type HomeDict = Record<string, string>;

export function HomeSeoAccordion({ dict }: { dict: HomeDict }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-10 sm:py-12 md:px-12">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="seo">
          <AccordionTrigger className="text-left text-sm font-black tracking-wide uppercase">
            {dict.seo_title}
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <p className="text-muted-foreground text-sm leading-relaxed">{dict.seo_intro}</p>
            <ul className="text-primary flex flex-wrap gap-3 text-xs font-bold uppercase">
              <li>
                <Link href="/akva-parkovi" className="hover:underline">
                  {dict.seo_link_parks}
                </Link>
              </li>
              <li>
                <Link href="/bazeni" className="hover:underline">
                  {dict.seo_link_pools}
                </Link>
              </li>
              <li>
                <Link href="/banje" className="hover:underline">
                  {dict.seo_link_spas}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:underline">
                  {dict.seo_link_how}
                </Link>
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
