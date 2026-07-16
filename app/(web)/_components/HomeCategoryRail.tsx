import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, type CategorySlug } from "@/lib/routing/categories";

const HOME_CATEGORIES: CategorySlug[] = ["akva-parkovi", "banje", "bazeni", "wellness-i-spa"];

export function HomeCategoryRail({ ariaLabel }: { ariaLabel?: string }) {
  return (
    <nav aria-label={ariaLabel || "Kategorije"} className="w-full max-w-3xl">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {HOME_CATEGORIES.map((slug) => (
          <li key={slug}>
            <Link href={`/${slug}`}>
              <Badge
                variant="secondary"
                className="hover:bg-primary hover:text-primary-foreground cursor-pointer px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-colors duration-150"
              >
                {CATEGORIES[slug].name}
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
