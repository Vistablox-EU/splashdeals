import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HomeDealCard } from "./HomeDealCard";
import type { HomeDeal } from "@/lib/home/deals";

type HomeDict = Record<string, string>;

export function HomeInventorySection({ dict, deals }: { dict: HomeDict; deals: HomeDeal[] }) {
  return (
    <section id="inventory" className="scroll-mt-28 pb-12 sm:pb-20">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="border-border mb-8 flex flex-wrap items-end justify-between gap-4 border-b pb-8">
          <div>
            <h2 className="mb-2 text-3xl font-black tracking-tighter uppercase italic sm:text-4xl">
              {dict.offers_title}
            </h2>
            <p className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase">
              {dict.offers_subtitle}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full text-[10px] font-black uppercase"
          >
            <Link href="/akva-parkovi">{dict.inventory_cta}</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 md:px-12">
        {deals.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center text-sm">
            {dict.default_ticket_desc}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal, i) => (
              <HomeDealCard
                key={deal.id}
                deal={deal}
                priority={i < 3}
                openTodayLabel={dict.open_today}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
