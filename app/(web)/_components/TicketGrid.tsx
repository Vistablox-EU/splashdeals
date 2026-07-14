import { Icon } from "@/components/ui/Icon";
import Image from "next/image";
import { prisma } from "@/app/(server)/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { dbValueToSlug, slugToName } from "@/lib/routing/categories";

async function getTickets() {
  const now = new Date();

  const data = await prisma.ticketPrice.findMany({
    where: {
      isActive: true,
      // Sale window: ticket must be within its valid sale period
      AND: [
        { OR: [{ saleStart: null }, { saleStart: { lte: now } }] },
        { OR: [{ saleEnd: null }, { saleEnd: { gte: now } }] },
      ],
      ticketType: {
        isActive: true,
        category: {
          isActive: true,
          facility: { status: "ACTIVE" },
        },
      },
    },
    include: {
      ticketType: {
        include: {
          category: {
            include: {
              facility: {
                include: {
                  media: {
                    where: { type: "PHOTO" },
                    orderBy: { order: "asc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
  });

  return data
    .map((ticketPrice) => {
      const facility = ticketPrice.ticketType?.category?.facility ?? null;
      const ticketType = ticketPrice.ticketType;

      if (!facility || !ticketType) return null;

      return {
        id: ticketPrice.id,
        title: ticketType.title || "Ulaznica",
        price: Number(ticketPrice.price),
        originalPrice: ticketPrice.originalPrice ? Number(ticketPrice.originalPrice) : null,
        currency: "RSD",
        validityType: ticketType.validityType || "FLEXIBLE_30_DAY",
        displayOrder: ticketPrice.displayOrder,
        description: ticketType.description || null,
        slug: ticketType.slug || null,
        imageUrl: ticketType.imageUrl || null,
        finePrint: null,
        requiresIdentity: ticketType.requiresIdentity || false,
        requiresPhoto: ticketType.requiresPhoto || false,
        dayType: ticketPrice.dayType,
        timeSlot: ticketPrice.timeSlot,
        isSeasonPass: ticketType.isSeasonPass || false,
        minPeople: ticketType.minPeople || 1,
        maxPeople: ticketType.maxPeople || null,
        saleStart: ticketPrice.saleStart,
        saleEnd: ticketPrice.saleEnd,
        createdAt: ticketPrice.createdAt,
        updatedAt: ticketPrice.updatedAt,
        facility: {
          id: facility.id,
          name: facility.name,
          slug: facility.slug,
          category: facility.category,
          cityId: facility.cityId,
          media: facility.media.map((m) => ({
            id: m.id,
            url: m.url,
            thumbnailUrl: m.thumbnailUrl,
            type: m.type,
            isHero: m.isHero,
            isCardBackground: m.isCardBackground,
            caption: m.caption,
            order: m.order,
          })),
        },
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);
}

 
export async function TicketGrid({ dict }: { dict: Record<string, any> }) {
  const allTickets = await getTickets();
  // Limit to max 4 cards as per user request for a single compact row
  const tickets = allTickets.slice(0, 4);

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Icon name="auto_awesome" className="text-muted-foreground mb-4 text-[48px]" />
        <p className="text-muted-foreground text-sm font-medium">{dict.home.default_ticket_desc}</p>
      </div>
    );
  }

  // Fill density if inventory is low (Marketplace SLA)
  const fillerCount = Math.max(0, 4 - tickets.length);
  const fillers = Array(fillerCount).fill(null);

  const priceFormat = new Intl.NumberFormat("sr-RS");

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {tickets.map((ticket, idx) => {
        const cardImage = ticket.facility.media?.[0]?.url || ticket.imageUrl;
        const dbSlug = dbValueToSlug(ticket.facility.category ?? "");
        const badgeLabel = (dbSlug ? slugToName(dbSlug) : null) ?? ticket.facility.category;

        const hasDiscount = ticket.originalPrice && ticket.originalPrice > ticket.price;

        return (
          <article
            key={ticket.id}
            className="group relative h-full transition-[transform,opacity,box-shadow] duration-700"
          >
            {/* Single overlay link covering the entire card */}
            <Link
              href={`/${ticket.facility.slug}#deals`}
              className="focus-visible:ring-primary absolute inset-0 z-20 rounded-xl focus-visible:ring-2"
              aria-label={`${ticket.facility.name} — ${ticket.title}`}
            />
            <Card className="group border-border hover:border-primary/30 flex h-full flex-col transition-[border-color,transform,box-shadow] duration-500 hover:-translate-y-2">
              <div className="relative h-40 w-full overflow-hidden sm:h-52">
                <div className="from-background/90 absolute inset-0 z-10 bg-gradient-to-t to-transparent" />
                {cardImage ? (
                  <Image
                    src={cardImage}
                    alt={`${ticket.facility.name} - ${ticket.title}`}
                    fill
                    priority={idx < 2}
                    loading={idx < 2 ? "eager" : "lazy"}
                    fetchPriority={idx < 2 ? "high" : "auto"}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                ) : (
                  <div className="bg-muted flex h-full w-full items-center justify-center">
                    <Icon name="auto_awesome" className="text-muted-foreground/50 text-[40px]" />
                  </div>
                )}

                <div className="pointer-events-none absolute bottom-4 left-4 z-30">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge className="bg-primary border-none px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ring-0">
                      {badgeLabel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-base font-black tracking-tight text-white uppercase italic">
                    <Icon name="location_on" className="text-primary text-[12px]" />
                    {ticket.facility.name}
                  </div>
                </div>
              </div>

              <div className="flex flex-grow flex-col p-4 sm:p-6">
                <h3 className="group-hover:text-primary mb-3 text-xl leading-tight font-black tracking-tight uppercase transition-colors">
                  {ticket.title}
                </h3>

                {/* ✨ Metadata badges */}
                {(ticket.isSeasonPass || ticket.minPeople > 1) && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {ticket.isSeasonPass && (
                      <span className="text-primary/70 text-[10px] font-bold tracking-wider uppercase">
                        Sezonska
                      </span>
                    )}
                    {ticket.minPeople > 1 && (
                      <span className="text-primary/70 text-[10px] font-bold tracking-wider uppercase">
                        od {ticket.minPeople} osobe
                      </span>
                    )}
                  </div>
                )}

                <p className="text-muted-foreground mb-6 line-clamp-2 text-xs leading-relaxed font-medium">
                  {ticket.description || dict.home.default_ticket_desc}
                </p>

                <div className="border-border group-hover:border-border relative z-30 mt-auto flex items-end justify-between border-t pt-6 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground/60 mb-0.5 text-[9px] font-black tracking-[0.2em] uppercase">
                      {ticket.currency}
                    </span>
                    <div className="flex items-baseline gap-2">
                      {hasDiscount && (
                        <span className="text-muted-foreground/40 text-sm font-medium line-through">
                          {priceFormat.format(ticket.originalPrice!)}
                        </span>
                      )}
                      <data
                        value={ticket.price}
                        className="text-foreground text-2xl font-black tracking-tighter italic sm:text-3xl"
                      >
                        {priceFormat.format(ticket.price)}
                      </data>
                    </div>
                  </div>

                  <AddToCartButton
                    ticket={{
                      id: ticket.id,
                      title: `${ticket.facility.name} - ${ticket.title}`,
                      price: ticket.price,
                      currency: ticket.currency,
                      validityType: ticket.validityType,
                      requiresIdentity: ticket.requiresIdentity,
                      requiresPhoto: ticket.requiresPhoto,
                      imageUrl: cardImage,
                      facility: {
                        id: ticket.facility.id,
                        name: ticket.facility.name,
                        category: ticket.facility.category,
                      },
                    }}
                  />
                </div>
              </div>
            </Card>
          </article>
        );
      })}

      {fillers.map((_, i) => (
        <div
          key={`filler-${i}`}
          className="pointer-events-none h-full opacity-40 grayscale transition-opacity duration-500 select-none"
        >
          <Card className="border-border flex h-full flex-col border-dashed opacity-50">
            <div className="bg-muted/50 flex h-52 w-full items-center justify-center">
              <Icon name="auto_awesome" className="text-muted-foreground/30 text-[40px]" />
            </div>
            <div className="flex flex-grow flex-col p-6">
              <div className="bg-muted mb-3 h-5 w-24 rounded-md" />
              <div className="bg-muted mb-2 h-3 w-full rounded-md" />
              <div className="bg-muted mb-6 h-3 w-2/3 rounded-md" />
              <div className="border-border mt-auto flex items-end justify-between border-t pt-6">
                <div className="bg-muted h-8 w-16 rounded-md" />
                <div className="bg-muted h-12 w-12 rounded-2xl" />
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
