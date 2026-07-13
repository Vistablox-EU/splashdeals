import { Icon } from "@/components/ui/Icon";
import Image from "next/image";
import { prisma } from "@/server/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { dbValueToSlug, slugToName } from "@/lib/routing/categories";

const CATEGORY_COLORS: Record<string, string> = {
  akva_park: "bg-cyan-500 hover:bg-cyan-600",
  banja_terme: "bg-amber-600 hover:bg-amber-700",
  wellness_spa: "bg-emerald-600 hover:bg-emerald-700",
  gradski_bazen: "bg-sky-600 hover:bg-sky-700",
};

function isOpenToday(hours: { dayOfWeek: number; isClosed: boolean }[]): boolean {
  if (!hours || hours.length === 0) return false;
  const today = new Date().getDay();
  const todayHours = hours.find((h) => h.dayOfWeek === today);
  return todayHours ? !todayHours.isClosed : false;
}

async function getTickets() {
  const now = new Date();

  const data = await prisma.ticketPrice.findMany({
    where: {
      isActive: true,
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
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  category: true,
                  city: true,
                  description: true,
                  media: {
                    where: { type: "PHOTO" },
                    orderBy: { order: "asc" },
                    take: 1,
                  },
                  hours: {
                    select: { dayOfWeek: true, isClosed: true },
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
          city: facility.city,
          description: facility.description || null,
          hours: facility.hours,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function TicketGrid({ dict }: { dict: Record<string, any> }) {
  const allTickets = await getTickets();
  const tickets = allTickets.slice(0, 6);

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Icon name="auto_awesome" className="text-muted-foreground mb-4 text-[48px]" />
        <p className="text-muted-foreground text-sm font-medium">{dict.home.default_ticket_desc}</p>
      </div>
    );
  }

  const fillerCount = Math.max(0, 6 - tickets.length);
  const fillers = Array(fillerCount).fill(null);

  const priceFormat = new Intl.NumberFormat("sr-RS");

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      {tickets.map((ticket, idx) => {
        const cardImage = ticket.facility.media?.[0]?.url || ticket.imageUrl;
        const dbSlug = dbValueToSlug(ticket.facility.category ?? "");
        const badgeLabel = (dbSlug ? slugToName(dbSlug) : null) ?? ticket.facility.category;

        const hasDiscount = ticket.originalPrice && ticket.originalPrice > ticket.price;
        const discountPercent = hasDiscount
          ? Math.round(
              ((Number(ticket.originalPrice) - Number(ticket.price)) /
                Number(ticket.originalPrice)) *
                100,
            )
          : 0;

        const categoryKey = dbSlug || "";
        const badgeColorClass = CATEGORY_COLORS[categoryKey] || "bg-primary hover:bg-primary/90";

        const openToday = isOpenToday(ticket.facility.hours);

        return (
          <article key={ticket.id} className="group relative h-full transition-all duration-700">
            {/* Single overlay link covering the entire card */}
            <Link
              href={`/${ticket.facility.slug}#deals`}
              className="focus-visible:ring-primary absolute inset-0 z-20 rounded-xl focus-visible:ring-2"
              aria-label={`${ticket.facility.name} — ${ticket.title}`}
            />
            <Card className="group border-border hover:border-primary/30 hover:shadow-primary/5 flex h-full flex-col overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
              {/* Facility name + city above image */}
              <div className="flex flex-col gap-0.5 px-3 pt-3 sm:px-4 sm:pt-4">
                <h3 className="text-foreground line-clamp-1 text-[11px] leading-tight font-black tracking-tight uppercase sm:text-xs">
                  {ticket.facility.name}
                </h3>
                {ticket.facility.city && (
                  <span className="text-muted-foreground flex items-center gap-1 text-[9px] font-bold">
                    <Icon name="location_on" className="text-primary/70 text-[9px]" />
                    {ticket.facility.city}
                  </span>
                )}
              </div>

              {/* Image — compact aspect ratio */}
              <div className="relative mx-3 mt-2 aspect-[4/5] w-[calc(100%-1.5rem)] overflow-hidden rounded-lg sm:mx-4 sm:w-[calc(100%-2rem)]">
                {cardImage ? (
                  <Image
                    src={cardImage}
                    alt={`${ticket.facility.name} - ${ticket.title}`}
                    fill
                    priority={idx < 2}
                    loading={idx < 2 ? "eager" : "lazy"}
                    fetchPriority={idx < 2 ? "high" : "auto"}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 20vw, 16vw"
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                ) : (
                  <div className="bg-muted flex h-full w-full items-center justify-center">
                    <Icon name="auto_awesome" className="text-muted-foreground/50 text-[40px]" />
                  </div>
                )}

                {/* Category badge on image — top left */}
                <div className="pointer-events-none absolute top-3 left-3 z-10">
                  <Badge
                    className={`${badgeColorClass} border-none px-2 py-0.5 text-[9px] font-black tracking-widest text-white uppercase ring-0`}
                  >
                    {badgeLabel}
                  </Badge>
                </div>

                {/* Discount pill on image — top right */}
                {hasDiscount && (
                  <div className="pointer-events-none absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] leading-none font-black text-amber-950 shadow-lg">
                      -{discountPercent}%
                    </span>
                  </div>
                )}

                {/* Open today indicator on image — bottom left */}
                {openToday && (
                  <div className="pointer-events-none absolute right-3 bottom-3 z-10">
                    <span className="bg-background/90 text-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] leading-none font-bold shadow-sm backdrop-blur-sm">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Otvoreno danas
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-grow flex-col px-3 pt-2 pb-3 sm:px-4 sm:pb-4">
                <h4 className="group-hover:text-primary mb-1 text-sm leading-tight font-black tracking-tight uppercase transition-colors">
                  {ticket.title}
                </h4>

                <p className="text-muted-foreground mb-2 line-clamp-2 text-[10px] leading-relaxed font-medium">
                  {ticket.description ||
                    ticket.facility.description ||
                    dict.home.default_ticket_desc}
                </p>

                <div className="relative z-30 mt-auto flex items-end justify-between gap-2">
                  <div className="flex flex-col">
                    {hasDiscount && (
                      <span className="text-muted-foreground/40 text-[8px] font-medium line-through sm:text-[9px]">
                        {priceFormat.format(ticket.originalPrice!)}
                      </span>
                    )}
                    <div className="flex items-baseline gap-1">
                      <data
                        value={ticket.price}
                        className="text-foreground text-base font-black tracking-tighter italic sm:text-lg"
                      >
                        {priceFormat.format(ticket.price)}
                      </data>
                      <span className="text-muted-foreground/60 text-[8px] font-black tracking-[0.2em] uppercase">
                        {ticket.currency}
                      </span>
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
          <Card className="border-border flex h-full flex-col overflow-hidden border-dashed opacity-50">
            <div className="px-3 pt-3 sm:px-4 sm:pt-4">
              <div className="bg-muted mb-1 h-3 w-3/4 rounded-md" />
              <div className="bg-muted h-2 w-1/2 rounded-md" />
            </div>
            <div className="bg-muted/50 mx-3 mt-2 flex aspect-[4/5] w-[calc(100%-1.5rem)] items-center justify-center rounded-lg sm:mx-4 sm:w-[calc(100%-2rem)]">
              <Icon name="auto_awesome" className="text-muted-foreground/30 text-[30px]" />
            </div>
            <div className="flex flex-grow flex-col px-3 pt-2 pb-3 sm:px-4 sm:pb-4">
              <div className="bg-muted mb-1 h-3 w-2/3 rounded-md" />
              <div className="mt-auto flex items-end justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="bg-muted h-2 w-12 rounded-sm" />
                  <div className="bg-muted h-4 w-16 rounded-md" />
                </div>
                <div className="bg-muted h-8 w-8 rounded-2xl" />
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
