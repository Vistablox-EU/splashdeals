import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { HomeDeal } from "@/lib/home/deals";

const priceFormat = new Intl.NumberFormat("sr-RS");

type HomeDict = Record<string, string>;

/** Illustrative 2+2 family math from best adult discount deal when kids data missing. */
export function HomeFamilyMath({
  dict,
  adultDeal,
}: {
  dict: HomeDict;
  adultDeal: HomeDeal | null;
}) {
  if (!adultDeal?.originalPrice || adultDeal.originalPrice <= adultDeal.price) {
    return null;
  }

  // Conservative demo: 2× adult deal vs 2× gate; kids estimated at 70% adult when no kids ticket.
  const adults = 2;
  const kids = 2;
  const kidFactor = 0.7;
  const gate = adults * adultDeal.originalPrice + kids * adultDeal.originalPrice * kidFactor;
  const deal = adults * adultDeal.price + kids * adultDeal.price * kidFactor;
  const save = Math.max(0, Math.round(gate - deal));

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-12">
      <Card className="border-border overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg space-y-2">
            <h2 className="text-2xl font-black tracking-tight uppercase italic sm:text-3xl">
              {dict.family_title}
            </h2>
            <p className="text-muted-foreground text-sm">{dict.family_subtitle}</p>
            <p className="text-muted-foreground text-[11px] leading-relaxed">{dict.family_note}</p>
            <p className="text-foreground text-xs font-bold">
              Primer na bazi: {adultDeal.facility.name}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-muted-foreground text-[9px] font-bold uppercase">
                {dict.family_gate}
              </p>
              <p className="text-lg font-black line-through">
                {priceFormat.format(Math.round(gate))}
              </p>
            </div>
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <p className="text-primary text-[9px] font-bold uppercase">{dict.family_deal}</p>
              <p className="text-lg font-black">{priceFormat.format(Math.round(deal))}</p>
            </div>
            <div className="rounded-xl bg-amber-500/15 p-3 text-center">
              <p className="text-[9px] font-bold text-amber-700 uppercase dark:text-amber-400">
                {dict.family_save}
              </p>
              <p className="text-lg font-black text-amber-700 dark:text-amber-400">
                {priceFormat.format(save)}
              </p>
            </div>
          </div>
          <Button asChild className="rounded-full">
            <Link href="#intent">{dict.family_cta}</Link>
          </Button>
        </div>
      </Card>
    </section>
  );
}
