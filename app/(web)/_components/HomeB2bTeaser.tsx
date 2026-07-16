import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";

type HomeDict = Record<string, string>;

export function HomeB2bTeaser({ dict }: { dict: HomeDict }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-12">
      <Card className="border-border bg-muted/20 flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
            <Icon name="business" className="text-[22px]" />
          </div>
          <div>
            <h2 className="mb-1 text-xl font-black tracking-tight uppercase italic">
              {dict.b2b_title}
            </h2>
            <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
              {dict.b2b_desc}
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0 rounded-full">
          <Link href="/support">{dict.b2b_cta}</Link>
        </Button>
      </Card>
    </section>
  );
}
