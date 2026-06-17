"use client";
import { Icon } from "@/components/ui/Icon";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useUIState } from "@/hooks/use-ui-state";
import { cn } from "@/lib/utils";

import type { TicketType, ValidityType } from "@prisma/client";

const VALIDITY_TYPES = ["FIXED_DATE", "SUMMER_SEASON", "FLEXIBLE_30_DAY"] as const;

const parseFacilityName = (name: string) => {
  const commonPrefixes = ["Akva Park", "Akva park", "Aquapark", "Banja", "Terme"];
  for (const prefix of commonPrefixes) {
    if (name.startsWith(prefix)) {
      return {
        prefix,
        main: name.slice(prefix.length).trim()
      };
    }
  }
  return { prefix: "", main: name };
};

export interface SerializedTicket {
  id: string;
  title: string;
  titleSr: string | null;
  type: TicketType;
  price: number;
  originalPrice: number | null;
  currency: string;
  validityType: ValidityType;
  isFeatured: boolean;
  description: string | null;
  descriptionSr: string | null;
  requiresIdentity: boolean;
  requiresPhoto: boolean;
  imageUrl?: string | null;
}

interface ShowcaseTicketGridProps {
  tickets: SerializedTicket[];
  facilityId: string;
  facilityName: string;
  category: string;
}

/**
 * 🎟️ ShowcaseTicketGrid Island (Client)
 * Handles stateful ticket filtering and fluid layout transitions.
 */
export function ShowcaseTicketGrid({ tickets, facilityId, facilityName, category }: ShowcaseTicketGridProps) {
  const { prefix, main } = parseFacilityName(facilityName);
  const [filter, setFilter] = useState<"ALL" | ValidityType>("ALL");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedId, setAddedId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const addItem = useCart((state) => state.addItem);
  const openCart = useUIState((state) => state.openCart);

  const getQuantity = (id: string) => quantities[id] || 1;
  const setQuantity = (id: string, q: number) => {
    if (typeof navigator !== 'undefined' && "vibrate" in navigator) {
      navigator.vibrate(10); // Tactile tick
    }
    setQuantities(prev => ({ ...prev, [id]: Math.min(20, Math.max(1, q)) }));
  };

  const filteredTickets = useMemo(() => {
    if (filter === "ALL") return tickets;
    return tickets.filter((t) => t.validityType === filter);
  }, [tickets, filter]);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 20);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
      const progress = (scrollLeft / (scrollWidth - clientWidth)) * 100;
      setScrollProgress(isNaN(progress) ? 0 : progress);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      checkScroll();
      // Initial delay to wait for layout
      setTimeout(checkScroll, 500); 
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, [filteredTickets]);

  const scroll = (offset: number) => {
    scrollContainerRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section id="tickets" className="space-y-12">
      <div className="flex flex-col items-center text-center gap-12">

          {/* 🎫 NAVIGATION & FILTERS */}
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 justify-between w-full">
            <div className="flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-xl">
              {(["ALL", ...VALIDITY_TYPES] as const).map((f) => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all relative overflow-hidden",
                    filter === f ? "bg-cyan-500 text-navy-deep shadow-[0_0_20px_rgba(6,182,212,0.3)]" : "text-slate-400 hover:text-white"
                  )}
                  aria-pressed={filter === f}
                  aria-label={`Filtriraj po: ${f === "ALL" ? "Sve" : f === "FIXED_DATE" ? "Datum" : f === "SUMMER_SEASON" ? "Sezona" : "Flex"}`}
                >
                  {f === "ALL" ? "Sve" : f === "FIXED_DATE" ? "Datum" : f === "SUMMER_SEASON" ? "Sezona" : "Flex"}
                  {filter === f && (
                    <div className="absolute inset-0 bg-cyan-500 -z-10" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 🎟️ TICKET MAPPING CONTAINER WITH OVERLAYS */}
          <div className="relative group/container w-full">
            {/* Liquid Left Blur/Gradient */}
            {canScrollLeft && (
              <>
                <div
                  className="absolute inset-y-0 -left-4 w-40 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none hidden md:block" 
                />
                <button
                  onClick={() => scroll(-420)}
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white shadow-3xl hover:bg-cyan-500 hover:text-navy-deep hover:scale-110 transition-all hidden md:flex active:scale-95"
                >
                  <Icon name="keyboard_arrow_left" className="text-[24px]" />
                </button>
              </>
            )}

            {/* Liquid Right Blur/Gradient */}
            {canScrollRight && (
              <>
                <div
                  className="absolute inset-y-0 -right-4 w-40 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none hidden md:block" 
                />
                <button
                  onClick={() => scroll(420)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white shadow-3xl hover:bg-cyan-500 hover:text-navy-deep hover:scale-110 transition-all hidden md:flex active:scale-95"
                >
                  <Icon name="keyboard_arrow_right" className="text-[24px]" />
                </button>
              </>
            )}

            <div 
              ref={scrollContainerRef}
              className="flex flex-row gap-8 overflow-x-auto pb-12 pt-4 px-4 -mx-4 no-scrollbar snap-x snap-mandatory scroll-smooth w-full cursor-grab active:cursor-grabbing select-none"
            >
              {filteredTickets.map((t) => (
                <div
                  key={t.id}
                  className="group flex-shrink-0 w-[340px] md:w-[420px] snap-start"
                >
                  <Card className={cn(
                    "h-full p-8 border-white/5 relative overflow-hidden flex flex-col justify-between transition-all duration-500",
                    t.isFeatured ? "border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_40px_rgba(6,182,212,0.1)]" : "hover:bg-white/5",
                    "hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] group-hover:scale-[1.03]"
                  )}>
                    {/* Energy Splash Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 splash-gradient rounded-full blur-[80px] opacity-10 -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                    
                    <div className="space-y-6 relative z-10">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <Badge className="bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest p-1 px-2 border-cyan-500/20">
                            {t.type === "ADULT" ? "Odrasli" : t.type === "CHILD" ? "Deca" : t.type === "FAMILY_BUNDLE" ? "Porodični paket" : "Standardna"}
                          </Badge>
                          {t.isFeatured && (
                            <div className="flex items-center gap-1 text-amber-400 font-black text-[9px] uppercase tracking-tighter">
                              <Icon name="bolt" className="text-[10px] fill-current" />
                              Najpopularnije
                            </div>
                          )}
                          {t.originalPrice && Number(t.originalPrice) > Number(t.price) && (
                            <div className="flex items-center gap-1 text-emerald-400 font-black text-[9px] uppercase tracking-wider animate-pulse mt-1">
                              <Icon name="auto_awesome" className="text-[10px]" />
                              Ušteda {Math.round(((Number(t.originalPrice) - Number(t.price)) / Number(t.originalPrice)) * 100)}%
                            </div>
                          )}
                        </div>
                        <div className="text-right flex flex-col items-end justify-center min-h-[60px]">
                          {/* Mobile Viewport (Concept B - Capsules Stacked Vertically to prevent narrow card overflow) */}
                          <div className="flex md:hidden flex-col items-end gap-1">
                            {t.originalPrice && Number(t.originalPrice) > Number(t.price) ? (
                              <>
                                {/* Gate Price Capsule */}
                                <div className="bg-rose-950/20 border border-rose-500/20 px-2 py-0.5 rounded-lg flex flex-col items-center justify-center min-w-[70px]">
                                  <span className="text-[6px] font-black text-rose-400 uppercase tracking-widest leading-none mb-0.5">
                                    {prefix && <span className="sr-only">{prefix} </span>}
                                    {main} cene
                                  </span>
                                  <span className="relative text-[10px] font-bold text-slate-400 leading-none">
                                    {t.originalPrice}
                                    <span className="absolute left-[-2px] right-[-2px] top-1/2 h-[1px] bg-rose-500 -rotate-12 pointer-events-none" />
                                  </span>
                                </div>

                                {/* Online Price Capsule */}
                                <div className="bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-lg flex flex-col items-center justify-center min-w-[75px] shadow-[0_0_8px_rgba(6,182,212,0.06)]">
                                  <span className="text-[6px] font-black text-cyan-400 uppercase tracking-widest leading-none mb-0.5">Online</span>
                                  <span className="text-xs font-black text-white leading-none">{t.price} {t.currency}</span>
                                </div>
                              </>
                            ) : (
                              <div className="text-right">
                                <div className="text-2xl font-black text-white leading-none">{t.price}</div>
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">{t.currency}</div>
                              </div>
                            )}
                          </div>

                          {/* Desktop Viewport (Concept A - Stamp with Diagonal Slash) */}
                          <div className="hidden md:flex items-center gap-4">
                            {t.originalPrice && Number(t.originalPrice) > Number(t.price) ? (
                              <div className="flex items-center gap-3 text-right">
                                {/* Gate Price */}
                                <div className="flex flex-col items-end">
                                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 leading-none mb-0.5">
                                    {prefix && <span className="sr-only md:not-sr-only">{prefix} </span>}
                                    {main} cene
                                  </span>
                                  <div className="relative inline-flex items-center">
                                    <span className="text-sm font-black text-slate-500 italic tracking-tight opacity-70">
                                      {t.originalPrice}
                                    </span>
                                    <span className="text-[8px] text-slate-500 font-bold ml-0.5 opacity-70">{t.currency}</span>
                                    <span 
                                      className="absolute left-[-2px] right-[-2px] top-1/2 h-[1.5px] bg-rose-500 -rotate-12 origin-center pointer-events-none shadow-[0_0_4px_rgba(244,63,94,0.6)]" 
                                      aria-hidden="true" 
                                    />
                                  </div>
                                </div>

                                {/* Online Price */}
                                <div className="flex flex-col items-end">
                                  <span className="text-[8px] font-black uppercase tracking-wider text-cyan-400 leading-none mb-0.5 animate-pulse">Kupi online</span>
                                  <div className="font-black text-white text-lg">
                                    {t.price} <span className="text-[10px] text-cyan-400 font-black uppercase">{t.currency}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-right flex flex-col items-end">
                                <div className="text-2xl font-black text-white leading-none">{t.price}</div>
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-0.5">{t.currency}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
 
                      <div className="space-y-4">
                        <h4 className="text-base md:text-lg font-black group-hover:text-cyan-400 transition-colors uppercase leading-[0.9] tracking-tight text-white">{t.titleSr || t.title}</h4>
                        <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                          {t.descriptionSr || t.description || "Zgrabite vašu kartu za nezaboravan dan. Ulaz obuhvata pristup svim standardnim sadržajima."}
                        </p>
                      </div>
 
                      <div className="space-y-3 pt-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Icon name="auto_awesome" className="text-[14px] text-cyan-400" />
                          Instant digitalna isporuka
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Icon name="calendar_month" className="text-[14px] text-cyan-400" />
                          {t.validityType === 'SUMMER_SEASON' ? 'Važi do kraja sezone' : 'Fleksibilan termin korišćenja'}
                        </div>
                      </div>
                    </div>
 
                    <div className="mt-auto pt-8 relative z-10 space-y-4">
                      <div className="flex items-center justify-between bg-white/5 rounded-2xl p-2 border border-white/5">
                        <button 
                          onClick={() => setQuantity(t.id, getQuantity(t.id) - 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-slate-400 transition-colors"
                          aria-label={`Smanji količinu za ${t.title}`}
                        >
                          <Icon name="remove" className="text-[16px]" />
                        </button>
                        <span className="font-black text-xl text-white w-8 text-center" aria-live="polite">{getQuantity(t.id)}</span>
                        <button 
                          onClick={() => setQuantity(t.id, getQuantity(t.id) + 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-slate-400 transition-colors"
                          aria-label={`Povećaj količinu za ${t.title}`}
                        >
                          <Icon name="add" className="text-[16px]" />
                        </button>
                      </div>
 
                      <Button 
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && "vibrate" in navigator) {
                            navigator.vibrate([15, 80, 15]); // Soft confirmation pattern
                          }
                          addItem({
                            ticketId: t.id,
                            facilityId,
                            facilityName,
                            category,
                            quantity: getQuantity(t.id),
                            title: t.titleSr || t.title,
                            price: t.price,
                            currency: t.currency,
                            requiresIdentity: t.requiresIdentity,
                            requiresPhoto: t.requiresPhoto,
                            validityType: t.validityType,
                            imageUrl: t.imageUrl,
                          });
                          setAddedId(t.id);
                          openCart();
                          setTimeout(() => setAddedId(null), 2000);
                        }}
                        className={cn(
                          "w-full h-14 font-black uppercase tracking-widest text-[10px] transition-all bg-primary text-black hover:bg-primary/90 rounded-full",
                          addedId === t.id ? "bg-green-500 text-slate-950" : ""
                        )}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {addedId === t.id ? (
                            <>
                              <Icon name="auto_awesome" className="text-[16px]" />
                              Dodato!
                            </>
                          ) : (
                            <>
                              <Icon name="shopping_bag" className="text-[16px]" />
                              Dodaj u korpu
                            </>
                          )}
                        </span>
                      </Button>
                    </div>
                  </Card>
                </div>
              ))}
            {filteredTickets.length === 0 && (
              <div
                className="w-full py-24 text-center space-y-4"
              >
                <Icon name="filter_list" className="text-[48px] text-slate-800 mx-auto" />
                <p className="text-slate-500 italic">Nema karata u ovoj kategoriji.</p>
              </div>
            )}
            </div>
          </div>

          {/* 💧 LIQUID PROGRESS BAR */}
          <div className="w-full max-w-md mx-auto space-y-4">
             <div className="h-1 w-full bg-white/5 rounded-full relative overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  style={{ width: `${scrollProgress}%` }}
                />
             </div>
             <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-500 px-1 opacity-60">
                <span>Splash Izbor</span>
                <span>{Math.round(scrollProgress)}% Pregledano</span>
             </div>
          </div>
        </div>
    </section>
  )
}
