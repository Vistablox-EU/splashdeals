import { prisma } from "@/server/lib/prisma";
import { notFound } from "next/navigation";
import { TicketGrid as HomeTicketGrid } from "@/app/(web)/ticketing/_components/TicketGrid";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/Icon";

/**
 * 🎫 Ticket Browse Page
 * Route: /[facilitySlug]/ulaznice
 * Shows all ticket categories, products, and prices for a facility in a full-page browse layout.
 */
export default async function FacilityTicketsPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
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
          Ulaznice — {facility.name}
        </h1>
        <p className="text-muted-foreground text-lg font-medium">
          Trenutno nema dostupnih ponuda za ovaj objekat.
        </p>
      </div>
    );
  }

  return (
    <div className="text-foreground mx-auto min-h-screen max-w-7xl px-6 pt-24 pb-32 sm:px-12">
      {/* Header */}
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
            Ulaznice
          </span>
        </div>
        <h1 className="text-foreground text-4xl leading-[0.9] font-black tracking-tighter uppercase italic md:text-6xl">
          Ulaznice — <span className="text-primary">{facility.name}</span>
        </h1>
      </div>

      {/* Ticket Categories */}
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

                return (
                  <Link
                    key={product.id}
                    href={`/${facility.slug}/ulaznice/${product.slug || product.id}`}
                    className="group block"
                  >
                    <Card className="border-border hover:border-primary/30 group relative flex h-full flex-col overflow-hidden transition-[border-color,transform,box-shadow] duration-500 hover:-translate-y-1">
                      {product.imageUrl && (
                        <div className="relative h-40 w-full overflow-hidden">
                          <Image
                            src={product.imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-6">
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <h3 className="text-foreground group-hover:text-primary text-lg leading-tight font-black tracking-tight uppercase italic transition-colors">
                            {product.title}
                          </h3>
                          {product.isSeasonPass && (
                            <Badge
                              variant="default"
                              className="border-primary/20 bg-primary/10 text-primary shrink-0 text-[9px] font-black tracking-widest uppercase"
                            >
                              Sezonska
                            </Badge>
                          )}
                        </div>

                        {product.description && (
                          <p className="text-muted-foreground mb-4 line-clamp-2 text-xs leading-relaxed font-medium">
                            {product.description}
                          </p>
                        )}

                        {/* Price summary */}
                        {bestPrice && (
                          <div className="border-border group-hover:border-border/80 mt-auto flex items-baseline gap-2 border-t pt-4 transition-colors">
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

                        {/* Price variations count */}
                        {product.prices.length > 1 && (
                          <span className="text-muted-foreground mt-2 text-[10px] font-bold tracking-widest uppercase">
                            + {product.prices.length - 1} varijanti
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
