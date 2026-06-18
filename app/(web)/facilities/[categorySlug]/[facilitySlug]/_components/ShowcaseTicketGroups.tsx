"use client";
import { Icon } from "@/components/ui/Icon";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useUIState } from "@/hooks/use-ui-state";
import { cn } from "@/lib/utils";
import type { DayType, TimeSlot } from "@prisma/client";
import { TicketPurchaseModal } from "./TicketPurchaseModal";

interface TicketTier {
  id: string;
  slug: string | null;
  label: string;
  labelSr: string | null;
  title: string;
  titleSr: string | null;
  description: string | null;
  descriptionSr: string | null;
  price: number;
  originalPrice: number | null;
  dayType: DayType | null;
  timeSlot: TimeSlot | null;
  minPeople: number;
  maxPeople: number | null;
  isSeasonPass: boolean;
  seasonStart: Date | null;
  seasonEnd: Date | null;
  isActive: boolean;
  requiresIdentity: boolean;
  requiresPhoto: boolean;
  imageUrl?: string | null;
}

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

interface TicketGroup {
  id: string;
  title: string;
  titleSr: string | null;
  description: string | null;
  descriptionSr: string | null;
  slug: string | null;
  tiers: TicketTier[];
}

interface ShowcaseTicketGroupsProps {
  groups: TicketGroup[];
  facilityId: string;
  facilityName: string;
  category: string;
  facility?: {
    id: string;
    name: string;
    category: string;
    streetName: string;
    streetNumber: string;
    city: string;
    slug: string | null;
  };
}

export function ShowcaseTicketGroups({ groups, facilityId, facilityName, category, facility }: ShowcaseTicketGroupsProps) {
  const { prefix, main } = parseFacilityName(facilityName);
  const [activeGroupId, setActiveGroupId] = useState<string>(groups[0]?.id || "");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedTicket, setSelectedTicket] = useState<TicketTier | null>(null);

  // Deep-linking: check URL hash or search params on mount to auto-open modal
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleCheck = () => {
        const hash = window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);
        const ticketParam = searchParams.get("t") || searchParams.get("ticket");

        let foundTicket = null;

        if (hash.startsWith("#ticket-")) {
          const ticketId = hash.replace("#ticket-", "");
          for (const group of groups) {
            const ticket = group.tiers.find((t) => t.id === ticketId);
            if (ticket) {
              foundTicket = ticket;
              break;
            }
          }
        } else if (ticketParam) {
          for (const group of groups) {
            const ticket = group.tiers.find((t) => t.slug === ticketParam || t.id === ticketParam);
            if (ticket) {
              foundTicket = ticket;
              break;
            }
          }
        }

        if (foundTicket) {
          setSelectedTicket(foundTicket);
        }
      };

      setTimeout(handleCheck, 150);

      window.addEventListener("hashchange", handleCheck);
      return () => window.removeEventListener("hashchange", handleCheck);
    }
  }, [groups]);

  const addItem = useCart((state) => state.addItem);
  const openCart = useUIState((state) => state.openCart);

  const cartItems = useCart((state) => state.items);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const getQuantity = (id: string) => quantities[id] || 1;
  const setQuantity = (id: string, q: number) => {
    if (typeof navigator !== 'undefined' && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, q) }));
  };

  if (groups.length === 0) {
    return (
      <div className="w-full py-24 text-center space-y-4">
        <Icon name="shopping_bag" className="text-[48px] text-slate-800 mx-auto" />
        <p className="text-muted-foreground italic">Trenutno nema dostupnih ponuda.</p>
      </div>
    );
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto pb-24 md:pb-0">
      {/* Scrollable glass pill tabs container */}
      <div className="relative w-full mb-8">
        {/* Right fade gradient overlay for mobile scroll indications */}
        <div className="absolute right-[-24px] top-0 bottom-0 w-16 bg-gradient-to-l from-slate-950 via-slate-950/60 to-transparent pointer-events-none z-10 md:hidden" />
        <div className="overflow-x-auto no-scrollbar scroll-smooth flex gap-2 pb-2 pt-1 px-6 -mx-6 md:mx-0 md:px-1 md:py-1 bg-transparent md:bg-muted/50 md:backdrop-blur-md rounded-none md:rounded-full border-none md:border md:border-border">
          {groups.map((group) => {
            const isActive = group.id === activeGroupId;
            return (
              <button
                key={group.id}
                onClick={() => setActiveGroupId(group.id)}
                className={cn(
                  "relative px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 shrink-0 select-none",
                  isActive 
                    ? "text-slate-950" 
                    : "text-muted-foreground hover:text-foreground bg-muted/50 md:bg-transparent border border-border md:border-none"
                )}
              >
                {isActive && (
                  <div
                    className="absolute inset-0 bg-cyan-400 rounded-full"
                  />
                )}
                <span className="relative z-10">{group.titleSr || group.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active group content with smooth transitions */}
      {activeGroup && (
        <div
          key={activeGroupId}
          className="w-full space-y-6"
        >
            {/* Description of active group if present */}
            {(activeGroup.descriptionSr || activeGroup.description) && (
              <div className="px-2 md:hidden">
                <p className="text-muted-foreground text-sm font-medium italic">
                  {activeGroup.descriptionSr || activeGroup.description}
                </p>
              </div>
            )}

            {/* Desktop Viewports layout */}
            <div className="hidden md:block">
              {activeGroup.tiers.length === 1 ? (
                <SingleTierCard
                  prefix={prefix}
                  main={main}
                  group={activeGroup}
                  tier={activeGroup.tiers[0]}
                  quantity={getQuantity(activeGroup.tiers[0].id)}
                  setQuantity={(q: number) => setQuantity(activeGroup.tiers[0].id, q)}
                  onAdd={() => {
                    setSelectedTicket(activeGroup.tiers[0]);
                  }}
                />
              ) : activeGroup.tiers.length >= 5 ? (
                <Card className="p-8 border-border overflow-visible">
                  <TierGrid
                    prefix={prefix}
                    main={main}
                    tiers={activeGroup.tiers}
                    quantities={quantities}
                    setQuantity={setQuantity}
                    onAdd={(tier: TicketTier) => {
                      setSelectedTicket(tier);
                    }}
                  />
                </Card>
              ) : (
                <Card className="p-8 border-border overflow-visible">
                  <TierList
                    prefix={prefix}
                    main={main}
                    tiers={activeGroup.tiers}
                    quantities={quantities}
                    setQuantity={setQuantity}
                    onAdd={(tier: TicketTier) => {
                      setSelectedTicket(tier);
                    }}
                  />
                </Card>
              )}
            </div>

            {/* Mobile Viewports Layout: Stack of high-density Adaptive Mobile Cards */}
            <div className="block md:hidden space-y-4">
              {activeGroup.tiers.map((tier: TicketTier) => {
                const label = (tier.labelSr || tier.label || "").toLowerCase();
                const isFeatured = label.includes("porodičn") || label.includes("paket") || label.includes("sezonsk") || label.includes("grupa");
                return (
                  <MobileTicketCard
                    key={tier.id}
                    prefix={prefix}
                    main={main}
                    tier={tier}
                    quantity={getQuantity(tier.id)}
                    setQuantity={(id: string, q: number) => setQuantity(id, q)}
                    isHighlighted={isFeatured}
                    onAdd={(tier: TicketTier) => {
                      setSelectedTicket(tier);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

      {/* Dynamic Sticky Checkout Drawer on Mobile */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden animate-in slide-in-from-bottom duration-300">
          <div className="backdrop-blur-xl bg-slate-950/80 border border-border rounded-3xl p-4 shadow-[0_10px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Izabrano</span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-black text-foreground">{totalItems} {totalItems === 1 ? 'ulaznica' : 'ulaznice'}</span>
                <span className="text-xs font-bold text-primary">{totalPrice} RSD</span>
              </div>
            </div>
            
            <Link 
              href="/cart"
              className="px-6 h-12 bg-cyan-400 hover:bg-cyan-300 active:scale-95 transition-all text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0"
            >
              <span>Kupi Odmah</span>
              <Icon name="bolt" className="text-[16px] fill-current animate-pulse" />
            </Link>
          </div>
        </div>
      )}

      <TicketPurchaseModal
        key={selectedTicket ? selectedTicket.id : "closed"}
        isOpen={selectedTicket !== null}
        onClose={() => setSelectedTicket(null)}
        ticket={selectedTicket}
        facility={facility || { id: facilityId, name: facilityName, category }}
      />
    </div>
  );
}

function SingleTierCard({ group, tier, quantity, setQuantity, onAdd, prefix, main }: {
  group: TicketGroup;
  tier: TicketTier;
  quantity: number;
  setQuantity: (qty: number) => void;
  onAdd: () => void;
  prefix: string;
  main: string;
}) {
  return (
    <Card id={`ticket-${tier.id}`} className="p-12 flex flex-col md:flex-row items-center justify-between gap-12 group border-border">
      <div className="space-y-4 text-center md:text-left flex-1">
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          <Badge className="bg-primary/10 text-primary font-black uppercase tracking-widest text-[10px] border-primary/20">
            {tier.isSeasonPass ? "Sezonska karta" : "Ulaznica"}
          </Badge>
          {tier.maxPeople && tier.maxPeople > 1 && (
            <Badge className="bg-emerald-500/10 text-emerald-400 font-black uppercase tracking-widest text-[10px] border-emerald-500/20">
              Porodični paket
            </Badge>
          )}
        </div>
        <h3 className="text-xl md:text-3xl font-black text-foreground italic tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">
          {group.titleSr || group.title}
        </h3>
        <p className="text-muted-foreground font-medium max-w-md italic">
          {group.descriptionSr || group.description || "Digitalna ulaznica za premium pristup sadržajima parka."}
        </p>
      </div>

      <div className="w-full md:w-auto space-y-8 bg-muted/50 p-8 rounded-[2.5rem] border border-border backdrop-blur-3xl min-w-[320px]">
        {/* Mobile Viewport (Concept B - Capsules) */}
        <div className="flex md:hidden items-center justify-between gap-4">
          {tier.originalPrice && Number(tier.originalPrice) > Number(tier.price) ? (
            <div className="flex items-center gap-2 w-full justify-between">
              {/* Gate Price Capsule */}
              <div className="bg-rose-950/20 border border-rose-500/20 px-3 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[100px] flex-1">
                <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">
                  {prefix && <span className="sr-only">{prefix} </span>}
                  {main} cene
                </span>
                <span className="relative text-sm font-bold text-muted-foreground leading-none">
                  {tier.originalPrice} <span className="text-[9px] text-muted-foreground">RSD</span>
                  <span className="absolute left-[-2px] right-[-2px] top-1/2 h-[1.5px] bg-rose-500 -rotate-12 pointer-events-none" />
                </span>
              </div>

              {/* Online Price Capsule */}
              <div className="bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[110px] flex-1 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <span className="text-[8px] font-black text-primary uppercase tracking-widest leading-none mb-1">Kupi online</span>
                <span className="text-base font-black text-foreground leading-none">{tier.price} RSD</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cena</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-foreground tracking-tighter">{tier.price}</span>
                <span className="text-xs font-black text-primary uppercase">RSD</span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Viewport (Concept A - Stamp with Diagonal Slash) */}
        <div className="hidden md:flex items-end justify-between gap-6 w-full">
          {tier.originalPrice && Number(tier.originalPrice) > Number(tier.price) ? (
            <div className="flex items-end justify-between w-full">
              {/* Gate Price (Na ulazu) */}
              <div className="space-y-1.5 pr-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block">
                  {prefix && <span className="sr-only md:not-sr-only">{prefix} </span>}
                  {main} cene
                </span>
                <div className="relative inline-flex items-center">
                  <span className="text-3xl font-black text-muted-foreground italic tracking-tight opacity-70">
                    {tier.originalPrice}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-bold ml-1 opacity-70">RSD</span>
                  <span 
                    className="absolute left-[-4px] right-[-4px] top-1/2 h-[3px] bg-rose-500 -rotate-12 origin-center pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.6)]" 
                    aria-hidden="true" 
                  />
                </div>
              </div>

              {/* Online Price (Kupi online) */}
              <div className="space-y-1 text-right">
                <span className="text-[9px] font-black uppercase tracking-wider text-primary block animate-pulse">Kupi online & uštedi</span>
                <div className="flex items-baseline gap-1.5 justify-end">
                  <span className="text-5xl font-black text-foreground tracking-tighter bg-gradient-to-r from-foreground to-muted-foreground/40 bg-clip-text text-transparent">{tier.price}</span>
                  <span className="text-xs font-black text-primary uppercase">RSD</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cena</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-foreground tracking-tighter">{tier.price}</span>
                <span className="text-xs font-black text-primary uppercase">RSD</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-black/20 rounded-2xl p-2 border border-border">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center hover:bg-muted/50 rounded-xl transition-colors text-muted-foreground">
            <Icon name="remove" className="text-[20px]" />
          </button>
          <span className="text-2xl font-black text-foreground">{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 flex items-center justify-center hover:bg-muted/50 rounded-xl transition-colors text-muted-foreground">
            <Icon name="add" className="text-[20px]" />
          </button>
        </div>

        <Button onClick={onAdd} className="w-full h-16 text-xs font-black tracking-[0.2em] uppercase bg-primary text-black hover:bg-primary/90 rounded-full">
          Dodaj u korpu
        </Button>
      </div>
    </Card>
  );
}

function TierList({ tiers, quantities, setQuantity, onAdd, prefix, main }: {
  tiers: TicketTier[];
  quantities: Record<string, number>;
  setQuantity: (id: string, qty: number) => void;
  onAdd: (tier: TicketTier) => void;
  prefix: string;
  main: string;
}) {
  return (
    <div className="space-y-4">
      {tiers.map((tier: TicketTier) => (
        <div key={tier.id} id={`ticket-${tier.id}`} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-muted/20 border border-border hover:bg-muted/50 transition-all group">
          
          {/* Ticket Information */}
          <div className="flex-1 space-y-2 text-center md:text-left w-full">
            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
              <h4 className="text-base md:text-lg font-black text-foreground uppercase italic tracking-tight">{tier.labelSr || tier.label}</h4>
              {tier.dayType && tier.dayType !== 'ALL' && (
                <Badge className="bg-slate-500/10 text-muted-foreground text-[9px] font-black uppercase tracking-tighter border-slate-500/20">
                  {tier.dayType === 'WEEKDAY' ? 'Radni dan' : 'Vikend'}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold text-muted-foreground">
              {tier.timeSlot && tier.timeSlot !== 'FULL_DAY' && (
                <span className="flex items-center gap-1.5">
                  <Icon name="schedule" className="text-[14px] text-primary" />
                  {tier.timeSlot === "AFTER_16H" ? "Poslepodne" : "Celodnevna"}
                </span>
              )}
              {tier.maxPeople && tier.maxPeople > 1 && (
                <span className="flex items-center gap-1.5">
                  <Icon name="group" className="text-[14px] text-primary" />
                  Do {tier.maxPeople} osoba
                </span>
              )}
              {tier.isSeasonPass && (
                <span className="flex items-center gap-1.5">
                  <Icon name="calendar_month" className="text-[14px] text-primary" />
                  Sezonska karta
                </span>
              )}
            </div>
          </div>

          {/* Pricing & Actions Section */}
          <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-6">
            
            {/* Desktop Pricing (Concept A) */}
            <div className="hidden md:flex items-center gap-6">
              {tier.originalPrice && Number(tier.originalPrice) > Number(tier.price) ? (
                <div className="flex items-center gap-4 text-right">
                  {/* Gate Price */}
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground leading-none mb-1">
                      {prefix && <span className="sr-only md:not-sr-only">{prefix} </span>}
                      {main} cene
                    </span>
                    <div className="relative inline-flex items-center">
                      <span className="text-lg font-black text-muted-foreground italic tracking-tight opacity-70">
                        {tier.originalPrice}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-bold ml-0.5 opacity-70">RSD</span>
                      <span 
                        className="absolute left-[-3px] right-[-3px] top-1/2 h-[2px] bg-rose-500 -rotate-12 origin-center pointer-events-none shadow-[0_0_6px_rgba(244,63,94,0.6)]" 
                        aria-hidden="true" 
                      />
                    </div>
                  </div>

                  {/* Online Price */}
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black uppercase tracking-wider text-primary leading-none mb-1 animate-pulse">Kupi online</span>
                    <div className="text-2xl font-black text-foreground leading-none">
                      {tier.price} <span className="text-[10px] text-primary font-black uppercase">RSD</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-right">
                  <div className="text-2xl font-black text-foreground leading-none">{tier.price} <span className="text-[10px] text-muted-foreground">RSD</span></div>
                </div>
              )}
            </div>

            {/* Mobile Pricing (Concept B - Capsules Full Width/Centered) */}
            <div className="flex md:hidden items-center justify-center gap-3 w-full my-1">
              {tier.originalPrice && Number(tier.originalPrice) > Number(tier.price) ? (
                <>
                  {/* Gate Price Capsule */}
                  <div className="bg-rose-950/20 border border-rose-500/20 px-3 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[100px] flex-1">
                    <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">
                      {prefix && <span className="sr-only">{prefix} </span>}
                      {main} cene
                    </span>
                    <span className="relative text-sm font-bold text-muted-foreground leading-none">
                      {tier.originalPrice} <span className="text-[10px] text-muted-foreground">RSD</span>
                      <span className="absolute left-[-2px] right-[-2px] top-1/2 h-[1.5px] bg-rose-500 -rotate-12 pointer-events-none" />
                    </span>
                  </div>

                  {/* Online Price Capsule */}
                  <div className="bg-primary/10 border border-primary/30 px-3.5 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[110px] flex-1 shadow-[0_0_12px_rgba(6,182,212,0.08)]">
                    <span className="text-[8px] font-black text-primary uppercase tracking-widest leading-none mb-1">Kupi online</span>
                    <span className="text-sm font-black text-foreground leading-none">{tier.price} RSD</span>
                  </div>
                </>
              ) : (
                <div className="text-center w-full">
                  <div className="text-2xl font-black text-foreground leading-none">{tier.price} <span className="text-[10px] text-muted-foreground uppercase">RSD</span></div>
                </div>
              )}
            </div>

            {/* Mobile/Desktop Quantity and CTA controls */}
            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
              <div className="flex items-center bg-black/20 rounded-xl p-1 border border-border shrink-0">
                <button onClick={() => setQuantity(tier.id, Math.max(1, (quantities[tier.id] || 1) - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground">
                  <Icon name="remove" className="text-[14px]" />
                </button>
                <span className="w-8 text-center font-black text-foreground text-base">{quantities[tier.id] || 1}</span>
                <button onClick={() => setQuantity(tier.id, (quantities[tier.id] || 1) + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground">
                  <Icon name="add" className="text-[14px]" />
                </button>
              </div>

              <Button onClick={() => onAdd(tier)} className="h-11 px-6 text-[10px] font-black uppercase tracking-widest flex-1 md:flex-initial min-w-[140px] md:min-w-[120px] bg-primary text-black hover:bg-primary/90 rounded-full">
                Dodaj
              </Button>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
}

function TierGrid({ tiers, quantities, setQuantity, onAdd, prefix, main }: {
  tiers: TicketTier[];
  quantities: Record<string, number>;
  setQuantity: (id: string, qty: number) => void;
  onAdd: (tier: TicketTier) => void;
  prefix: string;
  main: string;
}) {
  return (
    <div className="overflow-x-auto -mx-8 px-8">
      <table className="w-full text-left border-separate border-spacing-y-3">
        <thead>
          <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <th className="pb-4 pl-6">Kategorija</th>
            <th className="pb-4">Uslovi</th>
            <th className="pb-4 text-right">Cena</th>
            <th className="pb-4 text-center">Količina</th>
            <th className="pb-4 text-right pr-6">Akcija</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier: TicketTier) => (
            <tr key={tier.id} id={`ticket-${tier.id}`} className="bg-muted/20 border border-border hover:bg-muted/50 transition-all group">
              <td className="py-4 pl-6 rounded-l-3xl">
                <div className="font-black text-foreground uppercase italic tracking-tight">{tier.labelSr || tier.label}</div>
              </td>
              <td className="py-4">
                <div className="flex flex-wrap gap-2">
                  {tier.dayType && tier.dayType !== 'ALL' && (
                    <Badge variant="outline" className="text-[8px] font-black border-border text-muted-foreground">
                      {tier.dayType === "WEEKDAY" ? "Radni dan" : tier.dayType === "WEEKEND" ? "Vikend" : "Svi dani"}
                    </Badge>
                  )}
                  {tier.timeSlot && tier.timeSlot !== 'FULL_DAY' && (
                    <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary">
                      {tier.timeSlot === "AFTER_16H" ? "Poslepodne" : "Celodnevna"}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="py-4 text-right">
                {/* Mobile Viewport (Concept B - Capsules) */}
                <div className="flex md:hidden items-center justify-end gap-1.5">
                  {tier.originalPrice && Number(tier.originalPrice) > Number(tier.price) ? (
                    <>
                      {/* Gate Price Capsule */}
                      <div className="bg-rose-950/20 border border-rose-500/20 px-1.5 py-0.5 rounded-lg flex flex-col items-center justify-center min-w-[55px]">
                        <span className="text-[6px] font-black text-rose-400 uppercase tracking-widest leading-none mb-0.5">
                          {prefix && <span className="sr-only">{prefix} </span>}
                          {main} cene
                        </span>
                        <span className="relative text-[10px] font-bold text-muted-foreground leading-none">
                          {tier.originalPrice}
                          <span className="absolute left-[-1px] right-[-1px] top-1/2 h-[1px] bg-rose-500 -rotate-12 pointer-events-none" />
                        </span>
                      </div>

                      {/* Online Price Capsule */}
                      <div className="bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-lg flex flex-col items-center justify-center min-w-[65px]">
                        <span className="text-[6px] font-black text-primary uppercase tracking-widest leading-none mb-0.5">Online</span>
                        <span className="text-[11px] font-black text-foreground leading-none">{tier.price} RSD</span>
                      </div>
                    </>
                  ) : (
                    <div className="font-black text-foreground text-xs">{tier.price} <span className="text-[9px] text-muted-foreground uppercase">RSD</span></div>
                  )}
                </div>

                {/* Desktop Viewport (Concept A - Stamp with Diagonal Slash) */}
                <div className="hidden md:flex items-center justify-end gap-4">
                  {tier.originalPrice && Number(tier.originalPrice) > Number(tier.price) ? (
                    <div className="flex items-center gap-3 text-right">
                      {/* Gate Price */}
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground leading-none mb-0.5">
                          {prefix && <span className="sr-only md:not-sr-only">{prefix} </span>}
                          {main} cene
                        </span>
                        <div className="relative inline-flex items-center">
                          <span className="text-sm font-black text-muted-foreground italic tracking-tight opacity-70">
                            {tier.originalPrice}
                          </span>
                          <span className="text-[8px] text-muted-foreground font-bold ml-0.5 opacity-70">RSD</span>
                          <span 
                            className="absolute left-[-2px] right-[-2px] top-1/2 h-[1.5px] bg-rose-500 -rotate-12 origin-center pointer-events-none" 
                            aria-hidden="true" 
                          />
                        </div>
                      </div>

                      {/* Online Price */}
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black uppercase tracking-wider text-primary leading-none mb-0.5">Kupi online</span>
                        <div className="font-black text-foreground">
                          {tier.price} <span className="text-[10px] text-primary font-black uppercase">RSD</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="font-black text-foreground">{tier.price} <span className="text-[10px] text-muted-foreground uppercase">RSD</span></div>
                  )}
                </div>
              </td>
              <td className="py-4">
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => setQuantity(tier.id, Math.max(1, (quantities[tier.id] || 1) - 1))} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-md text-muted-foreground">
                    <Icon name="remove" className="text-[12px]" />
                  </button>
                  <span className="font-black text-foreground text-sm">{quantities[tier.id] || 1}</span>
                  <button onClick={() => setQuantity(tier.id, (quantities[tier.id] || 1) + 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-md text-muted-foreground">
                    <Icon name="add" className="text-[12px]" />
                  </button>
                </div>
              </td>
              <td className="py-4 text-right pr-6 rounded-r-3xl">
                <button 
                  onClick={() => onAdd(tier)}
                  className="bg-primary text-navy-deep p-2 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-cyan-500/20"
                >
                  <Icon name="shopping_bag" className="text-[16px]" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileTicketCard({ tier, quantity, setQuantity, onAdd, isHighlighted, prefix, main }: {
  tier: TicketTier;
  quantity: number;
  setQuantity: (id: string, qty: number) => void;
  onAdd: (tier: TicketTier) => void;
  isHighlighted: boolean;
  prefix: string;
  main: string;
}) {
  const hasDiscount = tier.originalPrice && Number(tier.originalPrice) > Number(tier.price);
  const discountPercent = hasDiscount 
    ? Math.round(((Number(tier.originalPrice) - Number(tier.price)) / Number(tier.originalPrice)) * 100)
    : 0;

  return (
    <div 
      id={`ticket-${tier.id}`}
      className={cn(
        "relative p-6 rounded-3xl transition-all duration-300 flex flex-col gap-5 border text-left",
        isHighlighted 
          ? "bg-gradient-to-br from-cyan-950/20 to-slate-900/40 border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.12)]" 
          : "bg-muted/20 border-border hover:bg-muted/50"
      )}
    >
      {isHighlighted && (
        <span className="absolute -top-3 right-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          Najpopularnije
        </span>
      )}

      {/* Title & Info */}
      <div className="space-y-2">
        <h4 className="text-base md:text-lg font-black text-foreground uppercase italic tracking-tight leading-tight">
          {tier.labelSr || tier.label}
        </h4>
        
        <div className="flex flex-wrap gap-2">
          {tier.dayType && tier.dayType !== 'ALL' && (
            <Badge className="bg-muted/50 text-foreground/80 text-[8px] font-black uppercase tracking-wider border-border">
              {tier.dayType === 'WEEKDAY' ? 'Radni dan' : 'Vikend'}
            </Badge>
          )}
          {tier.timeSlot && tier.timeSlot !== 'FULL_DAY' && (
            <Badge className="bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider border-cyan-500/10">
              {tier.timeSlot === "AFTER_16H" ? "Poslepodne" : "Celodnevna"}
            </Badge>
          )}
          {tier.isSeasonPass && (
            <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-wider border-emerald-500/10">
              Sezonska karta
            </Badge>
          )}
        </div>
      </div>

      {/* Pricing Row */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        {hasDiscount ? (
          <div className="flex items-center gap-3">
            {/* Gate Price (Na ulazu) */}
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground leading-none mb-1">
                {prefix && <span className="sr-only">{prefix} </span>}
                {main} cene
              </span>
              <div className="relative inline-flex items-center">
                <span className="text-sm font-bold text-muted-foreground line-through opacity-70">
                  {tier.originalPrice} RSD
                </span>
              </div>
            </div>

            {/* Online Price (Kupi online) */}
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-wider text-primary leading-none mb-1 animate-pulse">Kupi online</span>
              <span className="text-xl font-black text-foreground leading-none">
                {tier.price} <span className="text-[10px] text-primary font-black">RSD</span>
              </span>
            </div>

            {/* Discount Badge */}
            <Badge className="bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 ml-1">
              -{discountPercent}%
            </Badge>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground leading-none mb-1">Cena</span>
            <span className="text-xl font-black text-foreground">
              {tier.price} <span className="text-[10px] text-muted-foreground">RSD</span>
            </span>
          </div>
        )}
      </div>

      {/* Quantity & CTA */}
      <div className="flex items-center gap-3 border-t border-border pt-4">
        <div className="flex items-center bg-black/35 rounded-2xl p-1 border border-border shrink-0">
          <button 
            onClick={() => setQuantity(tier.id, Math.max(1, quantity - 1))} 
            className="w-10 h-10 flex items-center justify-center hover:bg-muted/50 rounded-xl transition-colors text-muted-foreground"
          >
            <Icon name="remove" className="text-[16px]" />
          </button>
          <span className="w-8 text-center font-black text-foreground text-base">{quantity}</span>
          <button 
            onClick={() => setQuantity(tier.id, quantity + 1)} 
            className="w-10 h-10 flex items-center justify-center hover:bg-muted/50 rounded-xl transition-colors text-muted-foreground"
          >
            <Icon name="add" className="text-[16px]" />
          </button>
        </div>

        <Button onClick={() => onAdd(tier)} className="h-12 px-4 text-[10px] font-black uppercase tracking-[0.15em] bg-primary text-black hover:bg-primary/90 rounded-full">
          Dodaj u korpu
        </Button>
      </div>
    </div>
  );
}
