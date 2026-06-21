import { Icon } from "@/components/ui/Icon";
import Image from "next/image";
import { prisma } from "@/server/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Badge } from "@/components/ui/badge";



async function getTickets() {
  const data = await prisma.ticket.findMany({
    where: { isActive: true },
    include: { 
      facility: {
        include: {
          media: {
            where: { type: "PHOTO" },
            orderBy: { order: "asc" },
            take: 1
          }
        }
      } 
    },
    orderBy: { displayOrder: 'asc' }
  });

  // 🛡️ Data Boundary: Serialize Decimal for Edge/PPR compatibility
  return data.map(({ facility, ...ticket }) => ({
    id: ticket.id,
    title: ticket.title,
    titleSr: ticket.titleSr,
    type: ticket.type,
    price: Number(ticket.price),
    originalPrice: ticket.originalPrice ? Number(ticket.originalPrice) : null,
    currency: ticket.currency,
    validityType: ticket.validityType,
    isActive: ticket.isActive,
    isFeatured: ticket.isFeatured,
    displayOrder: ticket.displayOrder,
    description: ticket.description,
    descriptionSr: ticket.descriptionSr,
    slug: ticket.slug,
    imageUrl: ticket.imageUrl,
    finePrint: ticket.finePrint,
    requiresIdentity: ticket.requiresIdentity,
    requiresPhoto: ticket.requiresPhoto,
    dayType: ticket.dayType,
    timeSlot: ticket.timeSlot,
    isSeasonPass: ticket.isSeasonPass,
    minPeople: ticket.minPeople,
    maxPeople: ticket.maxPeople,
    saleStart: ticket.saleStart,
    saleEnd: ticket.saleEnd,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    facility: {
      id: facility.id,
      name: facility.name,
      slug: facility.slug,
      category: facility.category,
      cityId: facility.cityId,
      media: facility.media.map(m => ({
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
    categorySlug: facility.category.toLowerCase().replace(/\s+/g, '-'),
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function TicketGrid({ dict }: { dict: Record<string, any>; }) {
  const allTickets = await getTickets();
  // Limit to max 4 cards as per user request for a single compact row
  const tickets = allTickets.slice(0, 4);

  // Fill density if inventory is low (Marketplace SLA)
  const fillerCount = Math.max(0, 4 - tickets.length);
  const fillers = Array(fillerCount).fill(null);

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {tickets.map((ticket) => {
        const ticketUrl = `/facilities/${ticket.categorySlug}/${ticket.facility.slug}#deals`;
        const cardImage = ticket.imageUrl || ticket.facility.media?.[0]?.url;
        
        return (
          <article 
            key={ticket.id}
            className="h-full transition-all duration-700"
          >
            <Card className="h-full flex flex-col group border-border hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
              <div className="relative h-52 w-full overflow-hidden rounded-t-[1.5rem]">
                <Link 
                  href={ticketUrl} 
                  className="absolute inset-0 z-20"
                  aria-label={`View details for ${ticket.title}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent z-10" />
                {cardImage ? (
                  <Image 
                    src={cardImage} 
                    alt={`${ticket.facility.name} - ${ticket.title}`} 
                    fill
                    priority={true}
                    loading="eager"
                    fetchPriority="high"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                     <Icon name="auto_awesome" className="text-[40px] text-slate-800" />
                  </div>
                )}
                
                <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                   <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-primary text-slate-950 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 ring-0">
                         {(dict?.categories as Record<string, string>)?.[ticket.facility.category.toLowerCase()] || ticket.facility.category}
                      </Badge>
                   </div>
                   <div className="flex items-center gap-1.5 text-white font-black italic tracking-tight uppercase text-base">
                      <Icon name="location_on" className="text-[12px] text-primary" />
                      {ticket.facility.name}
                   </div>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-grow relative">
                <Link 
                  href={ticketUrl} 
                  className="absolute inset-0 z-10 box-border"
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <h3 className="text-xl font-black leading-tight uppercase tracking-tight mb-3 group-hover:text-primary transition-colors">
                   {ticket.titleSr || ticket.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-medium mb-6">
                  {ticket.descriptionSr || ticket.description || dict.home.default_ticket_desc}
                </p>

                <div className="mt-auto pt-6 flex justify-between items-end border-t border-border group-hover:border-border transition-colors relative z-20">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0.5">{ticket.currency}</span>
                    <data value={ticket.price} className="text-3xl font-black text-white italic tracking-tighter">
                      {ticket.price}
                    </data>
                  </div>
                  
                  <AddToCartButton ticket={{
                    id: ticket.id,
                    title: `${ticket.facility.name} - ${ticket.titleSr || ticket.title}`,
                    price: ticket.price,
                    currency: ticket.currency,
                    validityType: ticket.validityType,
                    requiresIdentity: ticket.requiresIdentity,
                    requiresPhoto: ticket.requiresPhoto,
                    imageUrl: cardImage,
                    facility: {
                      id: ticket.facility!.id,
                      name: ticket.facility!.name,
                      category: ticket.facility!.category,
                    },
                  }} />
                </div>
              </div>
            </Card>
          </article>
        );
      })}

      {fillers.map((_, i) => (
        <div 
          key={`filler-${i}`}
          className="h-full pointer-events-none grayscale select-none transition-opacity duration-500 opacity-40"
        >
           <Card className="h-full flex flex-col border-dashed border-border opacity-50">
              <div className="h-52 w-full bg-muted/50 flex items-center justify-center">
                <Icon name="auto_awesome" className="text-[40px] text-slate-800" />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="h-5 w-24 bg-muted rounded-md mb-3" />
                <div className="h-3 w-full bg-muted rounded-md mb-2" />
                <div className="h-3 w-2/3 bg-muted rounded-md mb-6" />
                <div className="mt-auto pt-6 border-t border-border flex justify-between items-end">
                  <div className="h-8 w-16 bg-muted rounded-md" />
                  <div className="h-12 w-12 rounded-2xl bg-muted" />
                </div>
              </div>
           </Card>
        </div>
      ))}
    </div>
  );
}
