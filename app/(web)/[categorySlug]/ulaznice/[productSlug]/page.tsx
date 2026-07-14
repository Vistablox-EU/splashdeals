import { prisma } from "@/app/(server)/lib/prisma";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import Image from "next/image";
import Link from "next/link";

/**
 * 🎫 Ticket Detail Page
 * Route: /[facilitySlug]/ulaznice/[productSlug]
 * Shows a single ticket product with all prices, description, and CTA.
 */
export default async function TicketProductDetailPage({
  params,
}: {
  params: Promise<{ categorySlug: string; productSlug: string }>;
}) {
  const { categorySlug, productSlug } = await params;

  const facility = await prisma.facility.findUnique({
    where: { slug: categorySlug, status: "ACTIVE" },
    select: { id: true, name: true, slug: true, category: true },
  });
  if (!facility) notFound();

  // Find the product by slug across all category types
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

  // Find product by slug or id
  let foundProduct: (typeof categories)[number]["types"][number] | null = null;
  let foundCategory: (typeof categories)[number] | null = null;

  for (const cat of categories) {
    const prod = cat.types.find((t) => t.slug === productSlug || t.id === productSlug);
    if (prod) {
      foundProduct = prod;
      foundCategory = cat;
      break;
    }
  }

  if (!foundProduct || !foundCategory) notFound();

  const product = foundProduct;
  const category = foundCategory;

  // Helpers
  const priceFormat = new Intl.NumberFormat("sr-RS");

  const DAY_LABELS: Record<string, string> = {
    ALL: "Svi dani",
    WEEKDAY: "Radni dan",
    WEEKEND: "Vikend",
  };

  const TIME_LABELS: Record<string, string> = {
    FULL_DAY: "Ceo dan",
    AFTER_16H: "Posle 16h",
    THREE_HOUR: "3 sata",
  };

  return (
    <div className="text-foreground mx-auto min-h-screen max-w-5xl px-6 pt-24 pb-32 sm:px-12">
      {/* Breadcrumb */}
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
          Ulaznice
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-primary text-xs font-black tracking-widest uppercase">
          {product.title}
        </span>
      </div>

      {/* Hero Section */}
      <div className="mb-12 grid gap-8 md:grid-cols-2">
        {/* Left: Image + metadata */}
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
                  Sezonska karta
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

        {/* Right: Price card / CTA */}
        <div className="md:sticky md:top-28 md:self-start">
          <Card className="border-border overflow-visible p-8">
            <h3 className="text-foreground mb-6 text-lg font-black tracking-tight uppercase italic">
              Izaberite varijantu
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
                const dayLabel = DAY_LABELS[price.dayType ?? "ALL"];
                const timeLabel = TIME_LABELS[price.timeSlot ?? "FULL_DAY"];
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
                            Ušteda {discountPct}%
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

            {/* Info badges */}
            <div className="border-border mt-6 flex flex-wrap gap-3 border-t pt-6">
              {product.minPeople > 1 && (
                <div className="bg-muted/50 border-border flex items-center gap-2 rounded-xl border px-3 py-2">
                  <Icon name="group" className="text-muted-foreground text-[14px]" />
                  <span className="text-muted-foreground text-[10px] font-bold">
                    Min. {product.minPeople} {product.minPeople === 1 ? "osoba" : "osobe"}
                  </span>
                </div>
              )}
              {product.requiresIdentity && (
                <div className="bg-muted/50 border-border flex items-center gap-2 rounded-xl border px-3 py-2">
                  <Icon name="badge" className="text-muted-foreground text-[14px]" />
                  <span className="text-muted-foreground text-[10px] font-bold">
                    Potrebna lična karta
                  </span>
                </div>
              )}
              {product.requiresPhoto && (
                <div className="bg-muted/50 border-border flex items-center gap-2 rounded-xl border px-3 py-2">
                  <Icon name="photo_camera" className="text-muted-foreground text-[14px]" />
                  <span className="text-muted-foreground text-[10px] font-bold">
                    Potrebna fotografija
                  </span>
                </div>
              )}
            </div>

            {/* CTA */}
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-xs font-black tracking-widest uppercase shadow-lg transition-all active:scale-[0.98]"
            >
              <Link href={`/${facility.slug}#deals`}>
                <Icon name="shopping_bag" className="text-[18px]" />
                <span>Kupi na stranici objekta</span>
              </Link>
            </Button>
            <p className="text-muted-foreground/60 mt-2 text-center text-[9px] font-medium">
              Odaberite varijantu i količinu na stranici objekta
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
