import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";

type HomeDict = Record<string, string>;

export function HomeSocialProof({ dict }: { dict: HomeDict }) {
  const quotes = [
    { q: dict.social_1_quote, n: dict.social_1_name },
    { q: dict.social_2_quote, n: dict.social_2_name },
    { q: dict.social_3_quote, n: dict.social_3_name },
  ];

  return (
    <section className="border-border mx-auto max-w-7xl border-t px-6 py-12 sm:py-16 md:px-12">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-black tracking-tighter uppercase italic sm:text-4xl">
          {dict.social_title}
        </h2>
        <p className="text-muted-foreground text-sm">{dict.social_subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {quotes.map((item) => (
          <Card key={item.n} className="relative p-6">
            <Icon name="info" className="text-primary/30 mb-3 text-[28px]" />
            <p className="text-foreground mb-4 text-sm leading-relaxed font-medium">
              &ldquo;{item.q}&rdquo;
            </p>
            <p className="text-muted-foreground text-[11px] font-bold tracking-wide uppercase">
              {item.n}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
