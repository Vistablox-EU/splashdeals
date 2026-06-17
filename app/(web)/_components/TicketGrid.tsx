import { Icon } from "@/components/ui/Icon";
import Image from "next/image";
import { prisma } from "@/server/lib/prisma";
import Link from "next/link";
import { cacheLife } from 'next/cache';
import { GlassCard } from "@/components/ui/GlassCard";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Badge } from "./Badge";

import { connection } from "next/server";

async function getTickets() {
  "use cache";
  cacheLife("minutes");
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
  return data.map(ticket => ({
    ...ticket,
    price: Number(ticket.price),
    // Pre-calculate category slug for links
    categorySlug: ticket.facility.category.toLowerCase().replace(/\s+/g, '-')
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
      {tickets.map((ticket, idx) => {
        const ticketUrl = `/facilities/${ticket.categorySlug}/${ticket.facility.slug}#deals`;
        const cardImage = ticket.imageUrl || ticket.facility.media?.[0]?.url;
        
        return (
          <article 
            key={ticket.id}
            className="h-full transition-all duration-700"
          >
            <GlassCard className="h-full flex flex-col group border-white/5 hover:border-cyan-500/30 transition-all duration-500 hover:-translate-y-2">
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
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                     <Icon name="auto_awesome" className="text-[40px] text-slate-800" />
                  </div>
                )}
                
                <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                   <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-cyan-500 text-slate-950 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 ring-0">
                         {(dict?.categories as Record<string, string>)?.[ticket.facility.category.toLowerCase()] || ticket.facility.category}
                      </Badge>
                   </div>
                   <div className="flex items-center gap-1.5 text-white font-black italic tracking-tight uppercase text-base">
                      <Icon name="location_on" className="text-[12px] text-cyan-400" />
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
                <h3 className="text-xl font-black leading-tight uppercase tracking-tight mb-3 group-hover:text-cyan-400 transition-colors">
                   {ticket.titleSr || ticket.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-medium mb-6">
                  {ticket.descriptionSr || ticket.description || dict.home.default_ticket_desc}
                </p>

                <div className="mt-auto pt-6 flex justify-between items-end border-t border-white/5 group-hover:border-white/10 transition-colors relative z-20">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0.5">{ticket.currency}</span>
                    <data value={ticket.price} className="text-3xl font-black text-white italic tracking-tighter">
                      {ticket.price}
                    </data>
                  </div>
                  
                  <AddToCartButton ticket={{ ...ticket, imageUrl: cardImage }} />
                </div>
              </div>
            </GlassCard>
          </article>
        );
      })}

      {fillers.map((_, i) => (
        <div 
          key={`filler-${i}`}
          className="h-full pointer-events-none grayscale select-none transition-opacity duration-500 opacity-40"
        >
           <GlassCard className="h-full flex flex-col border-dashed border-white/10 opacity-50">
              <div className="h-52 w-full bg-slate-900/50 flex items-center justify-center">
                <Icon name="auto_awesome" className="text-[40px] text-slate-800" />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="h-5 w-24 bg-white/5 rounded-md mb-3" />
                <div className="h-3 w-full bg-white/5 rounded-md mb-2" />
                <div className="h-3 w-2/3 bg-white/5 rounded-md mb-6" />
                <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-end">
                  <div className="h-8 w-16 bg-white/5 rounded-md" />
                  <div className="h-12 w-12 rounded-2xl bg-white/5" />
                </div>
              </div>
           </GlassCard>
        </div>
      ))}
    </div>
  );
}
