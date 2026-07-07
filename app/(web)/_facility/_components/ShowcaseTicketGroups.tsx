"use client"
import { Icon } from "@/components/ui/Icon"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCart, MAX_QUANTITY_PER_ITEM } from "@/hooks/use-cart"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { TicketPurchaseModal } from "./TicketPurchaseModal"
import { Spinner } from "@/components/ui/spinner"

interface TicketTier {
  id: string;
  slug: string | null;
  title: string;
  label: string;
  price: number;
  originalPrice: number | null;
  description: string | null;
  dayType: string | null;
  timeSlot: string | null;
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

interface PriceOption {
  id: string;
  label: string | null;
  price: number;
  originalPrice: number | null;
  dayType: string | null;
  timeSlot: string | null;
}

interface ProductOption {
  id: string;
  title: string;
  label: string | null;
  minPeople: number;
  maxPeople: number | null;
  prices: PriceOption[];
}

interface ProductOption {
  id: string;
  title: string;
  label: string | null;
  minPeople: number;
  maxPeople: number | null;
  prices: PriceOption[];
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

const findBestDeal = (prices: PriceOption[]) => {
  const best = [...prices]
    .filter((p) => p.originalPrice && p.originalPrice > p.price)
    .sort((a, b) => {
      const aPct = ((Number(a.originalPrice) - Number(a.price)) / Number(a.originalPrice)) * 100;
      const bPct = ((Number(b.originalPrice) - Number(b.price)) / Number(b.originalPrice)) * 100;
      return bPct - aPct;
    })[0];
  return best?.id ?? null;
};

interface TicketGroup {
  id: string;
  title: string;
  description: string | null;
  tiers: TicketTier[];
}

interface ShowcaseTicketGroupsProps {
  groups: TicketGroup[];
  facilityId: string;
  facilitySlug: string;
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
  ticketProductMap?: Record<string, {
    id: string;
    title: string;
    label: string | null;
    minPeople: number;
    maxPeople: number | null;
    prices: PriceOption[];
  }>;
}

export function ShowcaseTicketGroups({ groups, facilityId, facilitySlug, facilityName, category, facility, ticketProductMap }: ShowcaseTicketGroupsProps) {
  const { prefix, main } = parseFacilityName(facilityName);
  const [activeGroupId, setActiveGroupId] = useState<string>(groups[0]?.id || "");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedTicket, setSelectedTicket] = useState<TicketTier | null>(null);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  const addItem = useCart((state) => state.addItem);
  const cartItems = useCart((state) => state.items);

  const getQuantity = (id: string) => quantities[id] || 0;
  const setQuantity = (id: string, q: number) => {
    if (typeof navigator !== 'undefined' && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, q) }));
  };

  if (groups.length === 0) {
    return (
      <div className="w-full py-24 text-center space-y-4">
        <Icon name="shopping_bag" className="text-[48px] text-foreground mx-auto" />
        <p className="text-muted-foreground italic">Trenutno nema dostupnih ponuda.</p>
      </div>
    );
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  // Cart totals from cart state
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const _handleBuySelection = () => {
    if (!facility) return;
    for (const tier of activeGroup.tiers) {
      const qty = getQuantity(tier.id);
      if (qty > 0) {
        addItem({
          ticketId: tier.id,
          facilityId: facility.id,
          facilityName: facility.name,
          category: facility.category,
          quantity: qty,
          title: `${facility.name} - ${tier.label || tier.title}`,
          price: Number(tier.price),
          currency: "RSD",
          requiresIdentity: false,
          requiresPhoto: false,
          validityType: tier.isSeasonPass ? "SUMMER_SEASON" : "FLEXIBLE_30_DAY",
          minPeople: tier.minPeople || 1,
          maxPeople: tier.maxPeople || null,
          imageUrl: tier.imageUrl || null,
        });
      }
    }
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([15, 80, 15]);
    window.location.href = "/cart";
  };

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto pb-24 md:pb-0">
      {/* Scrollable glass pill tabs container */}
      <div className="relative w-full mb-8">
        <div className="absolute right-[-24px] top-0 bottom-0 w-16 bg-gradient-to-l from-background via-background/60 to-transparent pointer-events-none z-10 md:hidden" />
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
                    ? "text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground bg-muted/50 md:bg-transparent border border-border md:border-none"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-primary rounded-full" />
                )}
                <span className="relative z-10">{group.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeGroup && (
        <div key={activeGroupId} className="w-full space-y-6">
          {(activeGroup.description) && (
            <div className="px-2 md:hidden">
              <p className="text-muted-foreground text-sm font-medium italic">
                {activeGroup.description}
              </p>
            </div>
          )}

          {/* Desktop */}
          <div className="hidden md:block">
            {activeGroup.tiers.length === 1 ? (
              <SingleTierCard
                prefix={prefix}
                main={main}
                group={activeGroup}
                tier={activeGroup.tiers[0]}
                quantity={getQuantity(activeGroup.tiers[0].id)}
                setQuantity={(q: number) => setQuantity(activeGroup.tiers[0].id, q)}
                onAdd={() => setSelectedTicket(activeGroup.tiers[0])}
              />
            ) : activeGroup.tiers.length >= 5 ? (
              <Card className="p-8 border-border overflow-visible">
                <TierGrid
                  prefix={prefix}
                  main={main}
                  tiers={activeGroup.tiers}
                  quantities={quantities}
                  setQuantity={setQuantity}
                  onAdd={(t: TicketTier) => setSelectedTicket(t)}
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
                  onAdd={(t: TicketTier) => setSelectedTicket(t)}
                />
              </Card>
            )}
          </div>

          {/* Mobile: Accordion-style rows */}
          <div className="block md:hidden space-y-2">
            {activeGroup.tiers.map((tier: TicketTier) => {
              const label = (tier.label || "").toLowerCase();
              const isFeatured = label.includes("porodičn") || label.includes("paket") || label.includes("sezonsk") || label.includes("grupa");
              return (
                <MobileTicketAccordion
                  key={tier.id}
                  tier={tier}
                  facility={facility || { id: facilityId, name: facilityName, category }}
                  isHighlighted={isFeatured}
                  isExpanded={expandedTier === tier.id}
                  onToggle={() => setExpandedTier(expandedTier === tier.id ? null : tier.id)}
                  cartCount={cartItems.filter(i => i.ticketId === tier.id).reduce((a, i) => a + i.quantity, 0)}
                  ticketProductMap={ticketProductMap}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky Drawer */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-[999] md:hidden animate-in slide-in-from-bottom duration-300">
          <div className="mobile-glass rounded-3xl p-4 shadow-[0_0_25px_rgba(6,182,212,0.1)] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Korpa</span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-black text-foreground">
                  {totalItems} {totalItems === 1 ? 'ulaznica' : 'ulaznice'}
                </span>
                <span className="text-xs font-bold text-primary">{totalPrice.toLocaleString("sr-Latn")} RSD</span>
              </div>
            </div>
            <button
              onClick={() => window.location.href = "/cart"}
              className="px-6 h-12 bg-primary hover:bg-primary/90 active:scale-95 transition-all text-primary-foreground font-black text-xs uppercase tracking-widest rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0 cursor-pointer"
            >
              <span>Kupi</span>
              <Icon name="arrow_forward" className="text-[16px]" />
            </button>
          </div>
        </div>
      )}

      <TicketPurchaseModal
        key={selectedTicket ? selectedTicket.id : "closed"}
        isOpen={selectedTicket !== null}
        onClose={() => setSelectedTicket(null)}
        facilitySlug={facilitySlug}
        initialProductId={selectedTicket?.id}
        ticket={selectedTicket}
        facility={facility || { id: facilityId, name: facilityName, category }}
      />
    </div>
  );
}

// ─── Mobile Accordion ─────────────────────────────────────────

function MobileTicketAccordion({ tier, facility, isHighlighted, isExpanded, onToggle, cartCount, ticketProductMap }: {
  tier: TicketTier;
  facility: { id: string; name: string; category: string };
  isHighlighted: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  cartCount: number;
  ticketProductMap?: Record<string, {
    id: string;
    title: string;
    label: string | null;
    minPeople: number;
    maxPeople: number | null;
    prices: PriceOption[];
  }>;
}) {
  const hasDiscount = tier.originalPrice && Number(tier.originalPrice) > Number(tier.price);
  const discountPercent = hasDiscount ? Math.round(((Number(tier.originalPrice) - Number(tier.price)) / Number(tier.originalPrice)) * 100) : 0;
  const addItem = useCart((state) => state.addItem);

  // ─── Expanded content state ─────────────────────────────────
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

// Resolve prices from the prop map (no API call needed)
  useEffect(() => {
    if (!isExpanded || !ticketProductMap) return;
    requestAnimationFrame(() => setLoadingPrices(true));

    // Flatten all products from the map
    const allProducts = Object.values(ticketProductMap);
    requestAnimationFrame(() => setProducts(allProducts));

    const current = allProducts.find((p) => p.id === tier.id);
    if (current) {
      const best = findBestDeal(current.prices);
      requestAnimationFrame(() => setSelectedPrice(best ?? current.prices[0]?.id ?? null));
      requestAnimationFrame(() => setQty(current.minPeople || 1));
    }
    requestAnimationFrame(() => setLoadingPrices(false));
  }, [isExpanded, ticketProductMap, tier.id]);

  const activeProduct = products.find((p) => p.id === tier.id);
  const activePrice = activeProduct?.prices.find((p) => p.id === selectedPrice) ?? activeProduct?.prices[0] ?? null;
  const bestDealId = activeProduct ? findBestDeal(activeProduct.prices) : null;

  const handleAdd = () => {
    if (!activePrice || !activeProduct || !facility) return;
    addItem({
      ticketId: activePrice.id,
      facilityId: facility.id,
      facilityName: facility.name,
      category: facility.category,
      quantity: qty,
      title: `${facility.name} - ${activeProduct.title}${activePrice.label ? ` (${activePrice.label})` : ""}`,
      price: activePrice.price,
      currency: "RSD",
      requiresIdentity: false,
      requiresPhoto: false,
      validityType: activeProduct.title.toLowerCase().includes("sezonsk") ? "SUMMER_SEASON" : "FLEXIBLE_30_DAY",
      minPeople: activeProduct.minPeople || 1,
      maxPeople: activeProduct.maxPeople || null,
      imageUrl: null,
    });
    setIsAdding(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([15, 80, 15]);
    setTimeout(() => {
      setIsAdding(false);
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
        onToggle();
      }, 600);
    }, 400);
  };

  return (
    <div className="border-b border-border/40 overflow-hidden transition-all duration-300">
      {/* Collapsed row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-3 transition-colors hover:bg-muted/10 active:bg-muted/20"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
          {tier.imageUrl && (
            <div className="relative w-10 h-10 shrink-0 rounded-xl overflow-hidden border border-border/50">
              <Image src={tier.imageUrl} alt={tier.label || tier.title} fill className="object-cover" sizes="40px" />
            </div>
          )}
          <span className="text-sm font-bold text-foreground tracking-tight truncate">{tier.label}</span>
          {hasDiscount && (
            <span className="shrink-0 inline-flex items-center justify-center w-[22px] h-[22px] bg-secondary text-secondary-foreground font-black text-[9px] leading-none rounded-full shadow-sm">
              {discountPercent}
            </span>
          )}
          {isHighlighted && (
            <span className="shrink-0 text-[7px] font-black uppercase tracking-widest bg-primary/15 text-primary px-1.5 py-0.5 rounded-full leading-none">
              Najpopularnije
            </span>
          )}
          {cartCount > 0 && (
            <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground text-[9px] font-black rounded-full">
              {cartCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tier.originalPrice && Number(tier.originalPrice) > 0 && (
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-bold text-muted-foreground line-through tabular-nums leading-none">
                {Number(tier.originalPrice).toLocaleString("sr-RS")}
              </span>
              <span className="text-[7px] text-muted-foreground font-bold">RSD</span>
            </div>
          )}
          <Icon name={isExpanded ? "expand_less" : "expand_more"} className="text-[18px] text-muted-foreground" />
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-4 animate-fade-in">
          {loadingPrices ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : !activeProduct || activeProduct.prices.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">Nema dostupnih varijanti.</p>
          ) : (
            <div className="space-y-3">
              {/* Variation options */}
              <div className="divide-y divide-border/40">
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest pb-1.5 block">Izaberite varijantu</span>
                {activeProduct.prices.map((p) => {
                  const isSel = selectedPrice === p.id;
                  const hasDisc = p.originalPrice && p.originalPrice > p.price;
                  const discPct = hasDisc ? Math.round(((Number(p.originalPrice) - Number(p.price)) / Number(p.originalPrice)) * 100) : 0;
                  const dayLabel = DAY_LABELS[p.dayType ?? "ALL"];
                  const timeLabel = TIME_LABELS[p.timeSlot ?? "FULL_DAY"];
                  const displayLabel = p.label || `${dayLabel} — ${timeLabel}`;

                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPrice(p.id)}
                      className={`w-full text-left py-2.5 flex items-center justify-between transition-colors ${
                        isSel ? "bg-primary/[0.02]" : "hover:bg-muted/10 active:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSel ? "border-primary" : "border-muted-foreground/30"
                        }`}>
                          {isSel && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-foreground block truncate">{displayLabel}</span>
                          {hasDisc && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              Ušteda {discPct}%
                              {p.id === bestDealId && (
                                <span className="text-[7px] font-black uppercase tracking-widest bg-secondary/20 text-secondary px-1 py-[1px] rounded-full leading-none">
                                  Najbolja ponuda
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5 shrink-0">
                        <span className="text-sm font-black text-foreground">{p.price.toLocaleString("sr-RS")}</span>
                        <span className="text-[9px] font-bold text-primary">RSD</span>
                        {hasDisc && (
                          <span className="text-[8px] text-muted-foreground line-through ml-0.5">
                            {p.originalPrice?.toLocaleString("sr-RS")}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quantity + Total + CTA */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Količina</span>
                <div className="flex items-center bg-muted/60 rounded-2xl p-1 border border-border shadow-inner">
                  <button
                    onClick={() => setQty(Math.max(activeProduct.minPeople || 1, qty - 1))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-muted/40 active:bg-muted/60 rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-90"
                    disabled={isAdding || isAdded || qty <= (activeProduct.minPeople || 1)}
                  >
                    <Icon name="remove" className="text-[12px]" />
                  </button>
                  <span className="w-8 text-center font-black text-foreground text-sm select-none">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(activeProduct.maxPeople ?? MAX_QUANTITY_PER_ITEM, qty + 1))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-muted/40 active:bg-muted/60 rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-90"
                    disabled={isAdding || isAdded || qty >= (activeProduct.maxPeople ?? MAX_QUANTITY_PER_ITEM)}
                  >
                    <Icon name="add" className="text-[12px]" />
                  </button>
                </div>
              </div>

              {activePrice && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ukupno</span>
                  <span className="text-lg font-black text-foreground">
                    {(activePrice.price * qty).toLocaleString("sr-RS")} RSD
                  </span>
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={isAdding || isAdded || !activePrice}
                className={`w-full h-12 rounded-2xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  isAdded
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : isAdding
                      ? "border-primary/10 bg-primary/5 text-primary cursor-not-allowed"
                      : "border-primary/20 bg-primary/15 text-primary hover:bg-primary/10 hover:border-primary/40 hover:text-primary/80"
                }`}
              >
                {isAdded ? (
                  <><Icon name="check" className="text-[16px] animate-scale-in" /><span>Dodato u korpu!</span></>
                ) : isAdding ? (
                  <><Spinner className="mr-2 inline" style={{width:"1rem",height:"1rem"}} /><span>Dodavanje...</span></>
                ) : (
                  <><Icon name="shopping_bag" className="text-[16px]" /><span>Dodaj u korpu</span></>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Desktop components (unchanged) ────────────────────────────

function SingleTierCard({ group, tier, quantity, setQuantity, onAdd, prefix: _prefix, main }: {
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
        {tier.imageUrl && (
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-border/50">
              <Image
                src={tier.imageUrl}
                alt={tier.title || tier.label}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl md:text-3xl font-black text-foreground italic tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">
                {group.title}
              </h3>
              <p className="text-muted-foreground font-medium max-w-md italic">
                {group.description || "Digitalna ulaznica za premium pristup sadržajima parka."}
              </p>
            </div>
          </div>
        )}
        {!tier.imageUrl && (
          <div className="space-y-2">
            <h3 className="text-xl md:text-3xl font-black text-foreground italic tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">
              {group.title}
            </h3>
            <p className="text-muted-foreground font-medium max-w-md italic">
              {group.description || "Digitalna ulaznica za premium pristup sadržajima parka."}
            </p>
          </div>
        )}
      </div>

      <div className="w-full md:w-auto space-y-8 bg-muted/50 p-8 rounded-[2.5rem] border border-border backdrop-blur-3xl min-w-[320px]">
        {/* Mobile only */}
        <div className="flex md:hidden items-center justify-between gap-4">
          {tier.originalPrice && Number(tier.originalPrice) > Number(tier.price) ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <div className="bg-rose-950/20 border border-rose-500/20 px-3 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[100px] flex-1">
                <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">
                  {main} cene
                </span>
                <span className="relative text-sm font-bold text-muted-foreground leading-none">
                  {tier.originalPrice} <span className="text-[9px] text-muted-foreground">RSD</span>
                  <span className="absolute left-[-2px] right-[-2px] top-1/2 h-[1.5px] bg-rose-500 -rotate-12 pointer-events-none" />
                </span>
              </div>
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

        {/* Desktop only */}
        <div className="hidden md:flex items-end justify-between gap-6 w-full">
          {tier.originalPrice && Number(tier.originalPrice) > Number(tier.price) ? (
            <div className="flex items-end justify-between w-full">
              <div className="space-y-1.5 pr-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground block">
                  {main} cene
                </span>
                <div className="relative inline-flex items-center">
                  <span className="text-3xl font-black text-muted-foreground italic tracking-tight opacity-70">
                    {tier.originalPrice}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-bold ml-1 opacity-70">RSD</span>
                  <span className="absolute left-[-4px] right-[-4px] top-1/2 h-[3px] bg-rose-500 -rotate-12 origin-center pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.6)]" aria-hidden="true" />
                </div>
              </div>
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

function TierList({ tiers, quantities, setQuantity, onAdd, prefix: _prefix, main: _main }: {
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
        <div key={tier.id} id={`ticket-${tier.id}`} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-muted/20 border border-border hover:bg-muted/50 transition-all group">
          <div className="flex-1 flex items-start gap-2 w-full">
            {tier.imageUrl && (
              <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden border border-border/50">
                <Image src={tier.imageUrl} alt={tier.label || tier.title} fill className="object-cover" sizes="56px" />
              </div>
            )}
            <div className="flex-1 space-y-1 text-center md:text-left w-full">
              <div className="flex items-center justify-center md:justify-start gap-1.5 flex-wrap">
                <h4 className="text-sm md:text-base font-black text-foreground uppercase italic tracking-tight">{tier.label}</h4>
                {tier.dayType && tier.dayType !== 'ALL' && (
                  <Badge className="bg-slate-500/10 text-muted-foreground text-[9px] font-black uppercase tracking-tighter border-slate-500/20">
                    {tier.dayType === 'WEEKDAY' ? 'Radni dan' : 'Vikend'}
                  </Badge>
                )}
                {tier.timeSlot && tier.timeSlot !== 'FULL_DAY' && (
                  <Badge className="bg-slate-500/10 text-muted-foreground text-[9px] font-black uppercase tracking-tighter border-slate-500/20">
                    {tier.timeSlot === 'AFTER_16H' ? 'Posle 16h' : tier.timeSlot === 'THREE_HOUR' ? '3 sata' : ''}
                  </Badge>
                )}
                {tier.isSeasonPass && <Badge className="bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-tighter border-amber-500/20">Sezonska</Badge>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-0 shrink-0">
            <div className="flex flex-col items-start md:items-end w-full md:w-auto">
              {tier.originalPrice && Number(tier.originalPrice) > Number(tier.price) ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-muted-foreground line-through">{tier.originalPrice} RSD</span>
                </div>
              ) : null}
              <div className="flex items-baseline gap-1">
                <span className="text-xl md:text-2xl font-black text-foreground tracking-tight">{tier.price}</span>
                <span className="text-[9px] font-bold text-primary uppercase">RSD</span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 border border-border">
              <button onClick={() => setQuantity(tier.id, (quantities[tier.id] || 0) - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted/50 rounded-md transition-colors text-muted-foreground active:scale-90">
                <Icon name="remove" className="text-[14px]" />
              </button>
              <span className="w-8 text-center text-sm font-black text-foreground select-none">{quantities[tier.id] || 0}</span>
              <button onClick={() => setQuantity(tier.id, (quantities[tier.id] || 0) + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted/50 rounded-md transition-colors text-muted-foreground active:scale-90">
                <Icon name="add" className="text-[14px]" />
              </button>
            </div>

            <Button onClick={() => onAdd(tier)} size="sm" className="h-9 px-4 text-[9px] font-black uppercase tracking-widest rounded-lg bg-primary text-black hover:bg-primary/90 shrink-0">
              Dodaj
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TierGrid({ tiers, quantities, setQuantity, onAdd, prefix: _prefix, main: _main }: {
  tiers: TicketTier[];
  quantities: Record<string, number>;
  setQuantity: (id: string, qty: number) => void;
  onAdd: (tier: TicketTier) => void;
  prefix: string;
  main: string;
}) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tiers.map((tier: TicketTier) => (
        <div key={tier.id} id={`ticket-${tier.id}`} className="flex flex-col gap-6 p-6 rounded-2xl bg-muted/20 border border-border hover:bg-muted/50 transition-all group">
          {tier.imageUrl && (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border/50 self-start">
              <Image src={tier.imageUrl} alt={tier.label || tier.title} fill className="object-cover" sizes="80px" />
            </div>
          )}
          <div className="space-y-1">
            <h4 className="text-base font-black text-foreground uppercase italic tracking-tight">{tier.label}</h4>
            <p className="text-xs text-muted-foreground">{tier.description || ""}</p>
          </div>
          <div className="mt-auto space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-foreground tracking-tight">{tier.price}</span>
              <span className="text-[10px] font-bold text-primary uppercase">RSD</span>
            </div>
            <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 border border-border">
              <button onClick={() => setQuantity(tier.id, (quantities[tier.id] || 0) - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted/50 rounded-md transition-colors text-muted-foreground">
                <Icon name="remove" className="text-[14px]" />
              </button>
              <span className="w-8 text-center text-sm font-black text-foreground select-none">{quantities[tier.id] || 0}</span>
              <button onClick={() => setQuantity(tier.id, (quantities[tier.id] || 0) + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-muted/50 rounded-md transition-colors text-muted-foreground">
                <Icon name="add" className="text-[14px]" />
              </button>
            </div>
            <Button onClick={() => onAdd(tier)} className="w-full h-10 text-[9px] font-black uppercase tracking-widest rounded-lg bg-primary text-black hover:bg-primary/90">
              Dodaj
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
