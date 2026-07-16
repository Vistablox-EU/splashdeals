import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/Icon";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { dbValueToSlug, slugToName } from "@/lib/routing/categories";
import type { HomeDeal } from "@/lib/home/deals";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  "akva-parkovi": "bg-cyan-500",
  banje: "bg-amber-600",
  bazeni: "bg-sky-600",
  "wellness-i-spa": "bg-emerald-600",
};

const priceFormat = new Intl.NumberFormat("sr-RS");

type Props = {
  deal: HomeDeal;
  priority?: boolean;
  openTodayLabel?: string;
  className?: string;
  showAddToCart?: boolean;
};

export function HomeDealCard({
  deal,
  priority = false,
  openTodayLabel = "Otvoreno danas",
  className,
  showAddToCart = true,
}: Props) {
  const dbSlug = dbValueToSlug(deal.facility.category ?? "") || "";
  const badgeLabel = (dbSlug ? slugToName(dbSlug) : null) ?? deal.facility.category ?? "";
  const badgeColor = CATEGORY_COLORS[dbSlug] || "bg-primary";
  const hasDiscount = deal.discountPercent > 0 && deal.originalPrice;

  return (
    <article className={cn("group relative h-full", className)}>
      <Link
        href={`/${deal.facility.slug}#deals`}
        className="focus-visible:ring-primary absolute inset-0 z-20 rounded-xl focus-visible:ring-2"
        aria-label={`${deal.facility.name} — ${deal.title}`}
      />
      <Card className="border-border hover:border-primary/30 flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="flex flex-col gap-0.5 px-3 pt-3 sm:px-4 sm:pt-4">
          <h3 className="text-foreground line-clamp-1 text-[11px] leading-tight font-black tracking-tight uppercase sm:text-xs">
            {deal.facility.name}
          </h3>
          {deal.facility.city ? (
            <span className="text-muted-foreground flex items-center gap-1 text-[9px] font-bold">
              <Icon name="location_on" className="text-primary/70 text-[9px]" />
              {deal.facility.city}
            </span>
          ) : null}
        </div>

        <div className="relative mx-3 mt-2 aspect-[4/3] w-[calc(100%-1.5rem)] overflow-hidden rounded-lg sm:mx-4 sm:w-[calc(100%-2rem)]">
          {deal.imageUrl ? (
            <Image
              src={deal.imageUrl}
              alt={`${deal.facility.name} - ${deal.title}`}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center">
              <Icon name="waves" className="text-muted-foreground/40 text-[40px]" />
            </div>
          )}

          {badgeLabel ? (
            <div className="pointer-events-none absolute top-3 left-3 z-10">
              <Badge
                className={cn(
                  badgeColor,
                  "border-none px-2 py-0.5 text-[9px] font-black tracking-widest text-white uppercase",
                )}
              >
                {badgeLabel}
              </Badge>
            </div>
          ) : null}

          {hasDiscount ? (
            <div className="pointer-events-none absolute top-3 right-3 z-10">
              <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-amber-950 shadow-lg">
                -{deal.discountPercent}%
              </span>
            </div>
          ) : null}

          {deal.facility.openToday ? (
            <div className="pointer-events-none absolute right-3 bottom-3 z-10">
              <span className="bg-background/90 text-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold shadow-sm backdrop-blur-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {openTodayLabel}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-grow flex-col px-3 pt-2 pb-3 sm:px-4 sm:pb-4">
          <h4 className="group-hover:text-primary mb-1 text-sm leading-tight font-black tracking-tight uppercase transition-colors">
            {deal.title}
          </h4>
          <p className="text-muted-foreground mb-2 line-clamp-2 text-[10px] leading-relaxed font-medium">
            {deal.pitch}
          </p>

          <div className="relative z-30 mt-auto flex items-end justify-between gap-2">
            <div className="flex flex-col">
              {hasDiscount ? (
                <span className="text-muted-foreground/50 text-[9px] line-through">
                  {priceFormat.format(deal.originalPrice!)}
                </span>
              ) : null}
              <div className="flex items-baseline gap-1">
                <data
                  value={deal.price}
                  className="text-foreground text-base font-black tracking-tighter italic sm:text-lg"
                >
                  {priceFormat.format(deal.price)}
                </data>
                <span className="text-muted-foreground/60 text-[8px] font-black tracking-[0.2em] uppercase">
                  {deal.currency}
                </span>
              </div>
            </div>

            {showAddToCart ? (
              <AddToCartButton
                ticket={{
                  id: deal.id,
                  title: `${deal.facility.name} - ${deal.title}`,
                  price: deal.price,
                  currency: deal.currency,
                  validityType: "FLEXIBLE_30_DAY",
                  requiresIdentity: false,
                  requiresPhoto: false,
                  imageUrl: deal.imageUrl,
                  facility: {
                    id: deal.facility.id,
                    name: deal.facility.name,
                    category: deal.facility.category ?? "",
                  },
                }}
              />
            ) : null}
          </div>
        </div>
      </Card>
    </article>
  );
}
