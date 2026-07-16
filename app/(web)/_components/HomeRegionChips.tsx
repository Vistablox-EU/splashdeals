import Link from "next/link";
import { Button } from "@/components/ui/button";

type HomeDict = Record<string, string>;

const REGIONS = [
  { key: "region_bg", href: "/search?q=Beograd" },
  { key: "region_vojvodina", href: "/search?q=Vojvodina" },
  { key: "region_central", href: "/search?q=Srbija" },
  { key: "region_south", href: "/search?q=Banja" },
] as const;

export function HomeRegionChips({ dict }: { dict: HomeDict }) {
  return (
    <section id="regions" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-12 md:px-12">
      <div className="mb-6 text-center">
        <h2 className="mb-1 text-3xl font-black tracking-tighter uppercase italic sm:text-4xl">
          {dict.region_title}
        </h2>
        <p className="text-muted-foreground text-sm">{dict.region_subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {REGIONS.map((r) => (
          <Button
            key={r.key}
            asChild
            variant="secondary"
            className="rounded-full px-5 text-[11px] font-black tracking-wide uppercase"
          >
            <Link href={r.href}>{dict[r.key]}</Link>
          </Button>
        ))}
      </div>
    </section>
  );
}
