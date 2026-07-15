import { Metadata } from "next";
import { prisma } from "@/app/(server)/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/Icon";
import { getDictionary } from "@/lib/dictionaries";
import { SITE_URL } from "@/app/(web)/facility/_data/schemas";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const facility = await prisma.facility.findUnique({
    where: { slug: categorySlug, status: "ACTIVE" },
    select: { name: true, slug: true, city: true, description: true },
  });
  if (!facility) notFound();

  const title = `Ulaznice — ${facility.name}`;
  const description =
    facility.description?.slice(0, 155) ||
    `Pregledajte sve ulaznice i cene za ${facility.name}${facility.city ? ` u ${facility.city}` : ""} na Splashdeals.`;
  const canonical = `${SITE_URL}/${facility.slug}/ulaznice`;

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
      images: [`${SITE_URL}/api/og/facility/${facility.slug}`],
    },
  };
}

/**
 * 🎫 Ticket Browse Page
 * Route: /[facilitySlug]/ulaznice
 */
export default async function FacilityTicketsPage({ params }: PageProps) {
  const { categorySlug } = await params;
  const dict = await getDictionary();
  const t = (dict.ticketing || {}) as Record<string, string>;
  const facility = await prisma.facility.findUnique({
    where: { slug: categorySlug, status: "ACTIVE" },
    select: { id: true, name: true, slug: true, category: true },
  });
  if (!facility) notFound();

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

  if (categories.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
        <Icon name="shopping_bag" className="text-muted-foreground mb-6 text-[64px]" />
        <h1 className="text-foreground mb-4 text-3xl font-black tracking-tighter uppercase italic">
          {t.tickets_for_facility?.replace("{name}", facility.name) ||
            `${t.tickets_label || "Ulaznice"} — ${facility.name}`}
        </h1>
        <p className="text-muted-foreground text-lg font-medium">
          {t.no_offers || "Trenutno nema dostupnih ponuda za ovaj objekat."}
        </p>
      </div>
    );
  }

  return (
    <div className="text-foreground mx-auto min-h-screen max-w-7xl px-6 pt-24 pb-32 sm:px-12">
      <div className="mb-12">
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Link
            href={`/${facility.slug}`}
            className="text-muted-foreground hover:text-foreground text-xs font-bold tracking-widest uppercase transition-colors"
          >
            {facility.name}
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-primary text-xs font-black tracking-widest uppercase">
            {t.tickets_label || "Ulaznice"}
          </span>
        </div>
        <h1 className="text-foreground text-4xl leading-[0.9] font-black tracking-tighter uppercase italic md:text-6xl">
          {t.tickets_label || "Ulaznice"} — <span className="text-primary">{facility.name}</span>
        </h1>
      </div>

      <div className="space-y-16">
        {categories.map((category) => (
          <section key={category.id} id={`cat-${category.slug || category.id}`}>
            <h2 className="text-foreground mb-8 text-2xl font-black tracking-tighter uppercase italic">
              {category.title}
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {category.types.map((product) => {
                const bestPrice = product.prices.reduce(
                  (min, p) => (Number(p.price) < Number(min.price) ? p : min),
                  product.prices[0],
                );
                const hasDiscount =
                  bestPrice?.originalPrice &&
                  Number(bestPrice.originalPrice) > Number(bestPrice.price);
                const productPath = product.slug || product.id;

                return (
                  <Link
                    key={product.id}
                    href={`/${facility.slug}/ulaznice/${productPath}`}
                    className="group block"
                  >
                    <Card className="border-border bg-muted/20 hover:border-primary/30 h-full overflow-hidden transition-colors">
                      {product.imageUrl && (
                        <div className="relative aspect-[16/10] w-full overflow-hidden">
                          <Image
                            src={product.imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      )}
                      <div className="flex flex-col p-5">
                        <div className="mb-2 flex flex-wrap gap-2">
                          {product.isSeasonPass && (
                            <Badge variant="secondary" className="text-[10px] font-black uppercase">
                              {t.season_pass || "Sezonska karta"}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-foreground text-lg font-black tracking-tight uppercase italic">
                          {product.title}
                        </h3>
                        {bestPrice && (
                          <div className="mt-3 flex items-baseline gap-2">
                            {hasDiscount && (
                              <span className="text-muted-foreground/40 text-xs font-medium line-through">
                                {Number(bestPrice.originalPrice).toLocaleString("sr-RS")}
                              </span>
                            )}
                            <span className="text-foreground text-2xl font-black tracking-tighter italic">
                              {Number(bestPrice.price).toLocaleString("sr-RS")}
                            </span>
                            <span className="text-primary text-[10px] font-bold uppercase">
                              RSD
                            </span>
                          </div>
                        )}
                        {product.prices.length > 1 && (
                          <span className="text-muted-foreground mt-2 text-[10px] font-bold tracking-widest uppercase">
                            {(t.more_variants || "+ {count} varijanti").replace(
                              "{count}",
                              String(product.prices.length - 1),
                            )}
                          </span>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
