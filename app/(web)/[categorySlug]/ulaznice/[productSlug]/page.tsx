import { Metadata } from "next";
import { prisma } from "@/app/(server)/lib/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import { SITE_URL } from "@/app/(web)/facility/_data/schemas";
import { getDayTypeLabel, getTimeSlotLabel } from "@/lib/ticketing/day-time-labels";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ categorySlug: string; productSlug: string }>;
}

async function loadProduct(categorySlug: string, productSlug: string) {
  const facility = await prisma.facility.findUnique({
    where: { slug: categorySlug, status: "ACTIVE" },
    select: { id: true, name: true, slug: true, category: true, city: true },
  });
  if (!facility) return null;

  const categories = await prisma.ticketCategory.findMany({
    where: { facilityId: facility.id, isActive: true },
    include: {
      types: {
        where: { isActive: true },
        include: {
          prices: {
            where: { isActive: true },
            orderBy: { displayOrder: "asc" },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  for (const cat of categories) {
    const prod = cat.types.find((t) => t.slug === productSlug || t.id === productSlug);
    if (prod) {
      return { facility, product: prod, category: cat };
    }
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug, productSlug } = await params;
  const loaded = await loadProduct(categorySlug, productSlug);
  if (!loaded) notFound();

  const { facility, product } = loaded;
  const minPrice =
    product.prices.length > 0 ? Math.min(...product.prices.map((p) => Number(p.price))) : null;
  const title = `${product.title} — ${facility.name}`;
  const description = [
    product.description?.slice(0, 120) || `Ulaznica ${product.title} za ${facility.name}`,
    minPrice != null ? `Već od ${minPrice} RSD.` : null,
    "Kupite digitalno na Splashdeals.",
  ]
    .filter(Boolean)
    .join(" ");
  const pathSeg = product.slug || product.id;
  const canonical = `${SITE_URL}/${facility.slug}/ulaznice/${pathSeg}`;

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Splashdeals",
      locale: "sr_RS",
      type: "website",
      images: product.imageUrl
        ? [{ url: product.imageUrl, alt: product.title }]
        : [`${SITE_URL}/api/og/facility/${facility.slug}`],
    },
  };
}

/**
 * 🎫 Ticket Detail Page
 * Route: /[facilitySlug]/ulaznice/[productSlug]
 */
export default async function TicketProductDetailPage({ params }: PageProps) {
  const { categorySlug, productSlug } = await params;
  const dict = await getDictionary();
  const t = (dict.ticketing || {}) as Record<string, string>;

  const loaded = await loadProduct(categorySlug, productSlug);
  if (!loaded) notFound();

  const { facility, product, category } = loaded;
  const priceFormat = new Intl.NumberFormat("sr-RS");
  const buyHref = `/${facility.slug}?product=${encodeURIComponent(product.id)}#deals`;

  return (
    <div className="text-foreground mx-auto min-h-screen max-w-5xl px-6 pt-24 pb-36 sm:px-12 sm:pb-32">
      <div className="mb-8 flex items-center gap-2 text-sm">
        <Link
          href={`/${facility.slug}`}
          className="text-muted-foreground hover:text-foreground text-xs font-bold tracking-widest uppercase transition-colors"
        >
          {facility.name}
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <Link
          href={`/${facility.slug}/ulaznice`}
          className="text-muted-foreground hover:text-foreground text-xs font-bold tracking-widest uppercase transition-colors"
        >
          {t.tickets_label || "Ulaznice"}
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-primary text-xs font-black tracking-widest uppercase">
          {product.title}
        </span>
      </div>

      <div className="mb-12 grid gap-8 md:grid-cols-2">
        <div>
          {product.imageUrl ? (
            <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-3xl">
              <Image
                src={product.imageUrl}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          ) : (
            <div className="bg-muted/30 mb-6 flex aspect-[4/3] w-full items-center justify-center rounded-3xl">
              <Icon name="confirmation_number" className="text-muted-foreground/30 text-[80px]" />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="default"
                className="border-primary/20 bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase"
              >
                {category.title}
              </Badge>
              {product.isSeasonPass && (
                <Badge
                  variant="default"
                  className="border-secondary/20 bg-secondary/10 text-secondary text-[10px] font-black tracking-widest uppercase"
                >
                  {t.season_pass || "Sezonska karta"}
                </Badge>
              )}
            </div>

            <h1 className="text-foreground text-3xl leading-[0.95] font-black tracking-tighter uppercase italic md:text-5xl">
              {product.title}
            </h1>

            {product.description && (
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed font-medium">
                {product.description}
              </p>
            )}
          </div>
        </div>

        <div className="md:sticky md:top-28 md:self-start">
          <Card className="border-border overflow-visible p-8">
            <h3 className="text-foreground mb-6 text-lg font-black tracking-tight uppercase italic">
              {t.choose_variant || "Izaberite varijantu"}
            </h3>

            <div className="divide-border/40 divide-y">
              {product.prices.map((price) => {
                const hasDiscount =
                  price.originalPrice && Number(price.originalPrice) > Number(price.price);
                const discountPct = hasDiscount
                  ? Math.round(
                      ((Number(price.originalPrice) - Number(price.price)) /
                        Number(price.originalPrice)) *
                        100,
                    )
                  : 0;
                const dayLabel = getDayTypeLabel(price.dayType);
                const timeLabel = getTimeSlotLabel(price.timeSlot);
                const displayLabel = price.label || `${dayLabel} — ${timeLabel}`;

                return (
                  <div key={price.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <span className="text-foreground block truncate text-sm font-bold">
                          {displayLabel}
                        </span>
                        {hasDiscount && (
                          <span className="text-muted-foreground inline-flex items-center gap-1 text-[9px]">
                            {(t.savings_pct || "Ušteda {pct}%").replace(
                              "{pct}",
                              String(discountPct),
                            )}
                          </span>
                        )}
                      </div>
                      <div className="ml-4 flex shrink-0 items-baseline gap-1.5">
                        {hasDiscount && (
                          <span className="text-muted-foreground/40 text-xs line-through">
                            {priceFormat.format(Number(price.originalPrice))}
                          </span>
                        )}
                        <span className="text-foreground text-xl font-black">
                          {priceFormat.format(Number(price.price))}
                        </span>
                        <span className="text-primary text-[10px] font-bold">RSD</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-border mt-6 flex flex-wrap gap-3 border-t pt-6">
              {product.minPeople > 1 && (
                <div className="bg-muted/50 border-border flex items-center gap-2 rounded-xl border px-3 py-2">
                  <Icon name="group" className="text-muted-foreground text-[14px]" />
                  <span className="text-muted-foreground text-[10px] font-bold">
                    {(t.min_people || "Min. {count} osobe").replace(
                      "{count}",
                      String(product.minPeople),
                    )}
                  </span>
                </div>
              )}
              {product.requiresIdentity && (
                <div className="bg-muted/50 border-border flex items-center gap-2 rounded-xl border px-3 py-2">
                  <Icon name="badge" className="text-muted-foreground text-[14px]" />
                  <span className="text-muted-foreground text-[10px] font-bold">
                    {t.requires_id || "Potrebna lična karta"}
                  </span>
                </div>
              )}
              {product.requiresPhoto && (
                <div className="bg-muted/50 border-border flex items-center gap-2 rounded-xl border px-3 py-2">
                  <Icon name="photo_camera" className="text-muted-foreground text-[14px]" />
                  <span className="text-muted-foreground text-[10px] font-bold">
                    {t.requires_photo || "Potrebna fotografija"}
                  </span>
                </div>
              )}
            </div>

            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-xs font-black tracking-widest uppercase shadow-lg transition-colors active:scale-[0.98]"
            >
              <Link href={buyHref}>
                <Icon name="shopping_bag" className="text-[18px]" />
                <span>{t.buy_on_facility || "Kupi sada"}</span>
              </Link>
            </Button>
            <p className="text-muted-foreground/60 mt-2 text-center text-[9px] font-medium">
              {t.buy_on_facility_hint || "Otvara izbor količine i varijante na stranici objekta"}
            </p>
          </Card>
        </div>
      </div>

      {/* Mobile sticky buy CTA above BottomNav */}
      <div className="border-border/50 bg-background/98 safe-area-bottom fixed inset-x-0 bottom-16 z-[999] border-t px-4 py-3 backdrop-blur-[40px] md:hidden">
        <Button
          asChild
          className="h-12 w-full rounded-2xl text-sm font-bold tracking-wide uppercase"
        >
          <Link href={buyHref}>
            <Icon name="shopping_bag" className="mr-2 text-[18px]" />
            {t.buy_on_facility || "Kupi sada"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
