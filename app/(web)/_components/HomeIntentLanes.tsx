import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";

type HomeDict = Record<string, string>;

const LANES = [
  {
    href: "/akva-parkovi",
    titleKey: "intent_family_title",
    descKey: "intent_family_desc",
    icon: "group",
  },
  {
    href: "/akva-parkovi",
    titleKey: "intent_weekend_title",
    descKey: "intent_weekend_desc",
    icon: "wb_sunny",
  },
  {
    href: "/banje",
    titleKey: "intent_thermal_title",
    descKey: "intent_thermal_desc",
    icon: "water_drop",
  },
  { href: "/bazeni", titleKey: "intent_pools_title", descKey: "intent_pools_desc", icon: "pool" },
] as const;

export function HomeIntentLanes({ dict }: { dict: HomeDict }) {
  return (
    <section id="intent" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-12 sm:py-16 md:px-12">
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="mb-2 text-3xl font-black tracking-tighter uppercase italic sm:text-4xl">
          {dict.intent_title}
        </h2>
        <p className="text-muted-foreground text-sm font-medium">{dict.intent_subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LANES.map((lane) => (
          <Link key={lane.titleKey + lane.href} href={lane.href} className="group">
            <Card className="border-border hover:border-primary/40 h-full p-5 transition-colors duration-150">
              <div className="bg-primary/10 text-primary mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
                <Icon name={lane.icon} className="text-[22px]" />
              </div>
              <h3 className="group-hover:text-primary mb-1 text-sm font-black tracking-wide uppercase transition-colors">
                {dict[lane.titleKey]}
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{dict[lane.descKey]}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
