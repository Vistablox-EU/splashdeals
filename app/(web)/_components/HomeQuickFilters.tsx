import Link from "next/link";
import { Button } from "@/components/ui/button";

type HomeDict = Record<string, string>;

export function HomeQuickFilters({ dict }: { dict: HomeDict }) {
  const items = [
    { href: "#ops-open", label: dict.filter_open_today },
    { href: "#intent", label: dict.filter_family },
    { href: "#savings", label: dict.filter_discount },
    { href: "#regions", label: dict.region_title },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {items.map((item) => (
        <Button
          key={item.href}
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-8 rounded-full text-[10px] font-bold tracking-wide uppercase"
        >
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
    </div>
  );
}
