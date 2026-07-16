import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";

type HomeDict = Record<string, string>;

const ITEMS = [
  { icon: "lock", title: "trust_1_title", desc: "trust_1_desc" },
  { icon: "bolt", title: "trust_2_title", desc: "trust_2_desc" },
  { icon: "apartment", title: "trust_3_title", desc: "trust_3_desc" },
  { icon: "support_agent", title: "trust_4_title", desc: "trust_4_desc" },
] as const;

export function HomeTrustStrip({ dict }: { dict: HomeDict }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10 sm:py-12 md:px-12">
      <h2 className="mb-6 text-center text-2xl font-black tracking-tighter uppercase italic sm:text-3xl">
        {dict.trust_title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <Card key={item.title} className="flex items-start gap-3 p-4">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Icon name={item.icon} className="text-[18px]" />
            </div>
            <div>
              <h3 className="mb-0.5 text-xs font-black tracking-wide uppercase">
                {dict[item.title]}
              </h3>
              <p className="text-muted-foreground text-[11px] leading-relaxed">{dict[item.desc]}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
