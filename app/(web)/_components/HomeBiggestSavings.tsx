import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HomeDealCard } from "./HomeDealCard";
import type { HomeDeal } from "@/lib/home/deals";

type HomeDict = Record<string, string>;

export function HomeBiggestSavings({ dict, deals }: { dict: HomeDict; deals: HomeDeal[] }) {
  if (deals.length === 0) return null;

  return (
    <section id="savings" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-10 sm:py-14 md:px-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="mb-1 text-3xl font-black tracking-tighter uppercase italic sm:text-4xl">
            {dict.savings_title}
          </h2>
          <p className="text-muted-foreground text-xs font-bold tracking-[0.15em] uppercase">
            {dict.savings_subtitle}
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full text-[10px] font-black uppercase"
        >
          <Link href="#inventory">{dict.savings_view_all}</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {deals.map((deal, i) => (
          <HomeDealCard
            key={deal.id}
            deal={deal}
            priority={i < 2}
            openTodayLabel={dict.open_today}
          />
        ))}
      </div>
    </section>
  );
}
