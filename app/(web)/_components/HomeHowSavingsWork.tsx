import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";

type HomeDict = Record<string, string>;

const ITEMS = [
  { icon: "confirmation_number", title: "how_savings_1_title", desc: "how_savings_1_desc" },
  { icon: "check_circle", title: "how_savings_2_title", desc: "how_savings_2_desc" },
  { icon: "qr_code", title: "how_savings_3_title", desc: "how_savings_3_desc" },
] as const;

export function HomeHowSavingsWork({ dict }: { dict: HomeDict }) {
  return (
    <section className="border-border mx-auto max-w-7xl border-t px-6 py-12 sm:py-16 md:px-12">
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="mb-2 text-3xl font-black tracking-tighter uppercase italic sm:text-4xl">
          {dict.how_savings_title}
        </h2>
        <p className="text-muted-foreground text-sm font-medium">{dict.how_savings_subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ITEMS.map((item) => (
          <Card key={item.title} className="p-6 text-center md:text-left">
            <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl md:mx-0">
              <Icon name={item.icon} className="text-[24px]" />
            </div>
            <h3 className="mb-2 text-sm font-black tracking-wide uppercase">{dict[item.title]}</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">{dict[item.desc]}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
