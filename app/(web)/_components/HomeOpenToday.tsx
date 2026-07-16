import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HomeDealCard } from "./HomeDealCard";
import type { HomeDeal } from "@/lib/home/deals";

type HomeDict = Record<string, string>;

export function HomeOpenToday({ dict, deals }: { dict: HomeDict; deals: HomeDeal[] }) {
  return (
    <section
      id="ops-open"
      className="border-border mx-auto max-w-7xl scroll-mt-28 border-t px-6 py-12 md:px-12"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="mb-1 text-3xl font-black tracking-tighter uppercase italic sm:text-4xl">
            {dict.ops_title}
          </h2>
          <p className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
            {dict.ops_subtitle}
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full text-[10px] font-black uppercase"
        >
          <Link href="/akva-parkovi">{dict.ops_view_all}</Link>
        </Button>
      </div>

      {deals.length === 0 ? (
        <p className="text-muted-foreground text-sm">{dict.ops_empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <HomeDealCard key={deal.id} deal={deal} openTodayLabel={dict.ops_open_badge} />
          ))}
        </div>
      )}
    </section>
  );
}
