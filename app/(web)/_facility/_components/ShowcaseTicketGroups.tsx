"use client";
import { Icon } from "@/components/ui/Icon";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart, MAX_QUANTITY_PER_ITEM } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { TicketPurchaseModal } from "./TicketPurchaseModal";

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

const parseFacilityName = (name: string) => {
  const commonPrefixes = ["Akva Park", "Akva park", "Aquapark", "Banja", "Terme"];
  for (const prefix of commonPrefixes) {
    if (name.startsWith(prefix)) {
      return {
        prefix,
        main: name.slice(prefix.length).trim(),
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
  ticketProductMap?: Record<
    string,
    {
      id: string;
      title: string;
      label: string | null;
      minPeople: number;
      maxPeople: number | null;
      prices: PriceOption[];
    }
  >;
}

export function ShowcaseTicketGroups({
  groups,
  facilityId,
  facilitySlug,
  facilityName,
  category,
  facility,
  ticketProductMap,
}: ShowcaseTicketGroupsProps) {
  const { prefix, main } = parseFacilityName(facilityName);
  const [activeGroupId, setActiveGroupId] = useState<string>(groups[0]?.id || "");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedTicket, setSelectedTicket] = useState<TicketTier | null>(null);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  const addItem = useCart((state) => state.addItem);
  const cartItems = useCart((state) => state.items);

  const getQuantity = (id: string) => quantities[id] || 0;
  const setQuantity = (id: string, q: number) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, q) }));
  };

  if (groups.length === 0) {
    return (
      <div className="w-full space-y-4 py-24 text-center">
        <Icon name="shopping_bag" className="text-foreground mx-auto text-[48px]" />
        <p className="text-muted-foreground italic">Trenutno nema dostupnih ponuda.</p>
      </div>
    );
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  // Cart totals from cart state
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-24 md:pb-0">
      {/* Scrollable glass pill tabs container */}
      <div className="relative mb-8 w-full">
        <div className="from-background via-background/60 pointer-events-none absolute top-0 right-[-24px] bottom-0 z-10 w-16 bg-gradient-to-l to-transparent lg:hidden" />
        <div className="no-scrollbar lg:bg-muted/50 lg:border-border -mx-6 flex gap-2 overflow-x-auto scroll-smooth rounded-none border-none bg-transparent px-6 pt-1 pb-2 lg:mx-0 lg:rounded-full lg:border lg:px-1 lg:py-1 lg:backdrop-blur-md">
          {groups.map((group) => {
            const isActive = group.id === activeGroupId;
            return (
              <button
                key={group.id}
                onClick={() => setActiveGroupId(group.id)}
                className={cn(
                  "relative shrink-0 rounded-full px-6 py-3 text-xs font-black tracking-widest uppercase transition-all duration-300 select-none",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground bg-muted/50 border-border border md:border-none md:bg-transparent",
                )}
              >
                {isActive && <div className="bg-primary absolute inset-0 rounded-full" />}
                <span className="relative z-10">{group.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeGroup && (
        <div key={activeGroupId} className="w-full space-y-6">
          {activeGroup.description && (
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
              <Card className="border-border overflow-visible p-8">
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
              <Card className="border-border overflow-visible p-8">
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
          <div className="block space-y-2 md:hidden">
            {activeGroup.tiers.map((tier: TicketTier) => {
              const label = (tier.label || "").toLowerCase();
              const isFeatured =
                label.includes("porodičn") ||
                label.includes("paket") ||
                label.includes("sezonsk") ||
                label.includes("grupa");
              return (
                <MobileTicketAccordion
                  key={tier.id}
                  tier={tier}
                  facility={facility || { id: facilityId, name: facilityName, category }}
                  isHighlighted={isFeatured}
                  isExpanded={expandedTier === tier.id}
                  onToggle={() => setExpandedTier(expandedTier === tier.id ? null : tier.id)}
                  cartCount={cartItems
                    .filter((i) => i.ticketId === tier.id)
                    .reduce((a, i) => a + i.quantity, 0)}
                  ticketProductMap={ticketProductMap}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky Drawer */}
      {totalItems > 0 && (
        <div className="animate-in slide-in-from-bottom fixed right-4 bottom-20 left-4 z-[999] duration-300 md:hidden">
          <div className="mobile-glass flex items-center justify-between gap-4 rounded-3xl p-4 shadow-[0_0_25px_rgba(6,182,212,0.1)]">
            <div className="space-y-0.5">
              <span className="text-muted-foreground text-[9px] font-black tracking-widest uppercase">
                Korpa
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-foreground text-sm font-black">
                  {totalItems} {totalItems === 1 ? "ulaznica" : "ulaznice"}
                </span>
                <span className="text-primary text-xs font-bold">
                  {totalPrice.toLocaleString("sr-Latn")} RSD
                </span>
              </div>
            </div>
            <Button
              onClick={() => (window.location.href = "/cart")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-6 text-xs font-black tracking-widest uppercase shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-95"
            >
              <span>Kupi</span>
              <Icon name="arrow_forward" className="text-[16px]" />
            </Button>
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

function MobileTicketAccordion({
  tier,
  facility,
  isHighlighted,
  isExpanded,
  onToggle,
  cartCount,
  ticketProductMap,
}: {
  tier: TicketTier;
  facility: { id: string; name: string; category: string };
  isHighlighted: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  cartCount: number;
  ticketProductMap?: Record<
    string,
    {
      id: string;
      title: string;
      label: string | null;
      minPeople: number;
      maxPeople: number | null;
      prices: PriceOption[];
    }
  >;
}) {
  const hasDiscount = tier.originalPrice && Number(tier.originalPrice) > Number(tier.price);
  const discountPercent = hasDiscount
    ? Math.round(
        ((Number(tier.originalPrice) - Number(tier.price)) / Number(tier.originalPrice)) * 100,
      )
    : 0;
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
  const activePrice =
    activeProduct?.prices.find((p) => p.id === selectedPrice) ?? activeProduct?.prices[0] ?? null;
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
      validityType: activeProduct.title.toLowerCase().includes("sezonsk")
        ? "SUMMER_SEASON"
        : "FLEXIBLE_30_DAY",
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
    <div className="border-border/40 overflow-hidden border-b transition-all duration-300">
      {/* Collapsed row */}
      <button
        onClick={onToggle}
        className="hover:bg-muted/10 active:bg-muted/20 flex w-full items-center justify-between px-3 py-3 transition-colors"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {tier.imageUrl && (
            <div className="border-border/50 relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border">
              <Image
                src={tier.imageUrl}
                alt={tier.label || tier.title}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          )}
          <span className="text-foreground truncate text-sm font-bold tracking-tight">
            {tier.label}
          </span>
          {hasDiscount && (
            <span className="bg-secondary text-secondary-foreground inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[9px] leading-none font-black shadow-sm">
              {discountPercent}
            </span>
          )}
          {isHighlighted && <Badge variant="secondary">Najpopularnije</Badge>}
          {cartCount > 0 && (
            <span className="bg-primary text-primary-foreground inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black">
              {cartCount}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {tier.originalPrice && Number(tier.originalPrice) > 0 && (
            <div className="flex items-baseline gap-1">
              <span className="text-muted-foreground text-[10px] leading-none font-bold tabular-nums line-through">
                {Number(tier.originalPrice).toLocaleString("sr-RS")}
              </span>
              <span className="text-muted-foreground text-[7px] font-bold">RSD</span>
            </div>
          )}
          <Icon
            name={isExpanded ? "expand_less" : "expand_more"}
            className="text-muted-foreground text-[18px]"
          />
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="animate-fade-in px-3 pb-4">
          {loadingPrices ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="refresh" className="text-primary size-5 animate-spin" />
            </div>
          ) : !activeProduct || activeProduct.prices.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-xs italic">
              Nema dostupnih varijanti.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Variation options */}
              <div className="divide-border/40 divide-y">
                <span className="text-muted-foreground block pb-1.5 text-[8px] font-black tracking-widest uppercase">
                  Izaberite varijantu
                </span>
                {activeProduct.prices.map((p) => {
                  const isSel = selectedPrice === p.id;
                  const hasDisc = p.originalPrice && p.originalPrice > p.price;
                  const discPct = hasDisc
                    ? Math.round(
                        ((Number(p.originalPrice) - Number(p.price)) / Number(p.originalPrice)) *
                          100,
                      )
                    : 0;
                  const dayLabel = DAY_LABELS[p.dayType ?? "ALL"];
                  const timeLabel = TIME_LABELS[p.timeSlot ?? "FULL_DAY"];
                  const displayLabel = p.label || `${dayLabel} — ${timeLabel}`;

                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPrice(p.id)}
                      className={`flex w-full items-center justify-between py-2.5 text-left transition-colors ${
                        isSel ? "bg-primary/[0.02]" : "hover:bg-muted/10 active:bg-muted/20"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            isSel ? "border-primary" : "border-muted-foreground/30"
                          }`}
                        >
                          {isSel && <div className="bg-primary h-2 w-2 rounded-full" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-foreground block truncate text-sm font-bold">
                            {displayLabel}
                          </span>
                          {hasDisc && (
                            <span className="text-muted-foreground flex items-center gap-1 text-[9px]">
                              Ušteda {discPct}%
                              {p.id === bestDealId && (
                                <Badge variant="secondary">Najbolja ponuda</Badge>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-baseline gap-1.5">
                        <span className="text-foreground text-sm font-black">
                          {p.price.toLocaleString("sr-RS")}
                        </span>
                        <span className="text-primary text-[9px] font-bold">RSD</span>
                        {hasDisc && (
                          <span className="text-muted-foreground ml-0.5 text-[8px] line-through">
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
                <span className="text-muted-foreground text-[9px] font-black tracking-widest uppercase">
                  Količina
                </span>
                <div className="bg-muted/60 border-border flex items-center rounded-2xl border p-1 shadow-inner">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQty(Math.max(activeProduct.minPeople || 1, qty - 1))}
                    disabled={isAdding || isAdded || qty <= (activeProduct.minPeople || 1)}
                    className="hover:bg-muted/40 active:bg-muted/60 text-muted-foreground hover:text-foreground h-8 w-8 rounded-xl active:scale-90"
                    aria-label="Smanji količinu"
                  >
                    <Icon name="remove" className="text-[12px]" />
                  </Button>
                  <span className="text-foreground w-8 text-center text-sm font-black select-none">
                    {qty}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setQty(Math.min(activeProduct.maxPeople ?? MAX_QUANTITY_PER_ITEM, qty + 1))
                    }
                    disabled={
                      isAdding ||
                      isAdded ||
                      qty >= (activeProduct.maxPeople ?? MAX_QUANTITY_PER_ITEM)
                    }
                    className="hover:bg-muted/40 active:bg-muted/60 text-muted-foreground hover:text-foreground h-8 w-8 rounded-xl active:scale-90"
                    aria-label="Povećaj količinu"
                  >
                    <Icon name="add" className="text-[12px]" />
                  </Button>
                </div>
              </div>

              {activePrice && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                    Ukupno
                  </span>
                  <span className="text-foreground text-lg font-black">
                    {(activePrice.price * qty).toLocaleString("sr-RS")} RSD
                  </span>
                </div>
              )}

              <Button
                onClick={handleAdd}
                disabled={isAdding || isAdded || !activePrice}
                className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl border text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
                  isAdded
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : isAdding
                      ? "border-primary/10 bg-primary/5 text-primary cursor-not-allowed"
                      : "border-primary/20 bg-primary/15 text-primary hover:bg-primary/10 hover:border-primary/40 hover:text-primary/80"
                }`}
              >
                {isAdded ? (
                  <>
                    <Icon name="check" className="animate-scale-in text-[16px]" />
                    <span>Dodato u korpu!</span>
                  </>
                ) : isAdding ? (
                  <>
                    <Icon name="refresh" className="mr-2 inline size-4 animate-spin" />
                    <span>Dodavanje...</span>
                  </>
                ) : (
                  <>
                    <Icon name="shopping_bag" className="text-[16px]" />
                    <span>Dodaj u korpu</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Desktop components (unchanged) ────────────────────────────

function SingleTierCard({
  group,
  tier,
  quantity,
  setQuantity,
  onAdd,
  prefix: _prefix,
  main,
}: {
  group: TicketGroup;
  tier: TicketTier;
  quantity: number;
  setQuantity: (qty: number) => void;
  onAdd: () => void;
  prefix: string;
  main: string;
}) {
  return (
    <Card
      id={`ticket-${tier.id}`}
      className="group border-border flex flex-col items-center justify-between gap-12 p-12 md:flex-row"
    >
      <div className="flex-1 space-y-4 text-center md:text-left">
        <div className="flex flex-wrap justify-center gap-2 md:justify-start">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black tracking-widest uppercase">
            {tier.isSeasonPass ? "Sezonska karta" : "Ulaznica"}
          </Badge>
          {tier.maxPeople && tier.maxPeople > 1 && (
            <Badge className="border-primary/20 bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase">
              Porodični paket
            </Badge>
          )}
        </div>
        {tier.imageUrl && (
          <div className="flex items-start gap-4">
            <div className="border-border/50 relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border">
              <Image
                src={tier.imageUrl}
                alt={tier.title || tier.label}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-foreground group-hover:text-primary text-xl leading-none font-black tracking-tighter uppercase italic transition-colors md:text-3xl">
                {group.title}
              </h3>
              <p className="text-muted-foreground max-w-md font-medium italic">
                {group.description || "Digitalna ulaznica za premium pristup sadržajima parka."}
              </p>
            </div>
          </div>
        )}
        {!tier.imageUrl && (
          <div className="space-y-2">
            <h3 className="text-foreground group-hover:text-primary text-xl leading-none font-black tracking-tighter uppercase italic transition-colors md:text-3xl">
              {group.title}
            </h3>
            <p className="text-muted-foreground max-w-md font-medium italic">
              {group.description || "Digitalna ulaznica za premium pristup sadržajima parka."}
            </p>
          </div>
        )}
      </div>

      <div className="bg-muted/50 border-border w-full min-w-[320px] space-y-8 rounded-[2.5rem] border p-8 backdrop-blur-3xl md:w-auto">
        {/* Mobile only */}
        <div className="flex items-center justify-between gap-4 md:hidden">
          {tier.originalPrice && Number(tier.originalPrice) > Number(tier.price) ? (
            <div className="flex w-full items-center justify-between gap-2">
              <div className="border-destructive/20 bg-destructive/20 flex min-w-[100px] flex-1 flex-col items-center justify-center rounded-xl border px-3 py-1.5">
                <span className="text-destructive mb-1 text-[8px] leading-none font-black tracking-widest uppercase">
                  {main} cene
                </span>
                <span className="text-muted-foreground relative text-sm leading-none font-bold">
                  {tier.originalPrice} <span className="text-muted-foreground text-[9px]">RSD</span>
                  <span className="bg-destructive pointer-events-none absolute top-1/2 right-[-2px] left-[-2px] h-[1.5px] -rotate-12" />
                </span>
              </div>
              <div className="bg-primary/10 border-primary/30 flex min-w-[110px] flex-1 flex-col items-center justify-center rounded-xl border px-3 py-1.5 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <span className="text-primary mb-1 text-[8px] leading-none font-black tracking-widest uppercase">
                  Kupi online
                </span>
                <span className="text-foreground text-base leading-none font-black">
                  {tier.price} RSD
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                Cena
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-foreground text-4xl font-black tracking-tighter">
                  {tier.price}
                </span>
                <span className="text-primary text-xs font-black uppercase">RSD</span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop only */}
        <div className="hidden w-full items-end justify-between gap-6 md:flex">
          {tier.originalPrice && Number(tier.originalPrice) > Number(tier.price) ? (
            <div className="flex w-full items-end justify-between">
              <div className="space-y-1.5 pr-2">
                <span className="text-muted-foreground block text-[9px] font-black tracking-wider uppercase">
                  {main} cene
                </span>
                <div className="relative inline-flex items-center">
                  <span className="text-muted-foreground text-3xl font-black tracking-tight italic opacity-70">
                    {tier.originalPrice}
                  </span>
                  <span className="text-muted-foreground ml-1 text-[10px] font-bold opacity-70">
                    RSD
                  </span>
                  <span
                    className="bg-destructive pointer-events-none absolute top-1/2 right-[-4px] left-[-4px] h-[3px] origin-center -rotate-12 shadow-[0_0_8px_hsl(var(--destructive)/0.6)]"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-primary block animate-pulse text-[9px] font-black tracking-wider uppercase">
                  Kupi online & uštedi
                </span>
                <div className="flex items-baseline justify-end gap-1.5">
                  <span className="text-foreground from-foreground to-muted-foreground/40 bg-gradient-to-r bg-clip-text text-5xl font-black tracking-tighter text-transparent">
                    {tier.price}
                  </span>
                  <span className="text-primary text-xs font-black uppercase">RSD</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                Cena
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-foreground text-5xl font-black tracking-tighter">
                  {tier.price}
                </span>
                <span className="text-primary text-xs font-black uppercase">RSD</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-border bg-muted/40 flex items-center justify-between rounded-2xl border p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="hover:bg-muted/50 text-muted-foreground h-12 w-12 rounded-xl"
            aria-label="Smanji količinu"
          >
            <Icon name="remove" className="text-[20px]" />
          </Button>
          <span className="text-foreground text-2xl font-black">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuantity(Math.min(MAX_QUANTITY_PER_ITEM, quantity + 1))}
            className="hover:bg-muted/50 text-muted-foreground h-12 w-12 rounded-xl"
            aria-label="Povećaj količinu"
          >
            <Icon name="add" className="text-[20px]" />
          </Button>
        </div>

        <Button
          onClick={onAdd}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full rounded-full text-xs font-black tracking-[0.2em] uppercase"
        >
          Dodaj u korpu
        </Button>
      </div>
    </Card>
  );
}

function TierList({
  tiers,
  quantities,
  setQuantity,
  onAdd,
  prefix: _prefix,
  main: _main,
}: {
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
        <div
          key={tier.id}
          id={`ticket-${tier.id}`}
          className="bg-muted/20 border-border hover:bg-muted/50 group flex flex-col justify-between gap-3 rounded-2xl border p-3 transition-all md:flex-row md:items-center"
        >
          <div className="flex w-full flex-1 items-start gap-2">
            {tier.imageUrl && (
              <div className="border-border/50 relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border">
                <Image
                  src={tier.imageUrl}
                  alt={tier.label || tier.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            )}
            <div className="w-full flex-1 space-y-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-1.5 md:justify-start">
                <h4 className="text-foreground text-sm font-black tracking-tight uppercase italic md:text-base">
                  {tier.label}
                </h4>
                {tier.dayType && tier.dayType !== "ALL" && (
                  <Badge className="text-muted-foreground border-muted/30 bg-muted/20 text-[9px] font-black tracking-tighter uppercase">
                    {tier.dayType === "WEEKDAY" ? "Radni dan" : "Vikend"}
                  </Badge>
                )}
                {tier.timeSlot && tier.timeSlot !== "FULL_DAY" && (
                  <Badge className="text-muted-foreground border-muted/30 bg-muted/20 text-[9px] font-black tracking-tighter uppercase">
                    {tier.timeSlot === "AFTER_16H"
                      ? "Posle 16h"
                      : tier.timeSlot === "THREE_HOUR"
                        ? "3 sata"
                        : ""}
                  </Badge>
                )}
                {tier.isSeasonPass && (
                  <Badge className="border-primary/20 bg-primary/10 text-primary text-[9px] font-black tracking-tighter uppercase">
                    Sezonska
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-0 flex w-full shrink-0 items-center justify-between gap-6 md:w-auto md:justify-end">
            <div className="flex w-full flex-col items-start md:w-auto md:items-end">
              {tier.originalPrice && Number(tier.originalPrice) > Number(tier.price) ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground text-xs font-bold line-through">
                    {tier.originalPrice} RSD
                  </span>
                </div>
              ) : null}
              <div className="flex items-baseline gap-1">
                <span className="text-foreground text-xl font-black tracking-tight md:text-2xl">
                  {tier.price}
                </span>
                <span className="text-primary text-[9px] font-bold uppercase">RSD</span>
              </div>
            </div>

            <div className="border-border bg-muted/40 flex items-center gap-1 rounded-lg border p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(tier.id, (quantities[tier.id] || 0) - 1)}
                className="hover:bg-muted/50 text-muted-foreground h-8 w-8 rounded-md active:scale-90"
                aria-label="Smanji količinu"
              >
                <Icon name="remove" className="text-[14px]" />
              </Button>
              <span className="text-foreground w-8 text-center text-sm font-black select-none">
                {quantities[tier.id] || 0}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setQuantity(
                    tier.id,
                    Math.min(MAX_QUANTITY_PER_ITEM, (quantities[tier.id] || 0) + 1),
                  )
                }
                className="hover:bg-muted/50 text-muted-foreground h-8 w-8 rounded-md active:scale-90"
                aria-label="Povećaj količinu"
              >
                <Icon name="add" className="text-[14px]" />
              </Button>
            </div>

            <Button
              onClick={() => onAdd(tier)}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 rounded-lg px-4 text-[9px] font-black tracking-widest uppercase"
            >
              Dodaj
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TierGrid({
  tiers,
  quantities,
  setQuantity,
  onAdd,
  prefix: _prefix,
  main: _main,
}: {
  tiers: TicketTier[];
  quantities: Record<string, number>;
  setQuantity: (id: string, qty: number) => void;
  onAdd: (tier: TicketTier) => void;
  prefix: string;
  main: string;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tiers.map((tier: TicketTier) => (
        <div
          key={tier.id}
          id={`ticket-${tier.id}`}
          className="bg-muted/20 border-border hover:bg-muted/50 group flex flex-col gap-6 rounded-2xl border p-6 transition-all"
        >
          {tier.imageUrl && (
            <div className="border-border/50 relative h-20 w-20 self-start overflow-hidden rounded-xl border">
              <Image
                src={tier.imageUrl}
                alt={tier.label || tier.title}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          )}
          <div className="space-y-1">
            <h4 className="text-foreground text-base font-black tracking-tight uppercase italic">
              {tier.label}
            </h4>
            <p className="text-muted-foreground text-xs">{tier.description || ""}</p>
          </div>
          <div className="mt-auto space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-foreground text-3xl font-black tracking-tight">
                {tier.price}
              </span>
              <span className="text-primary text-[10px] font-bold uppercase">RSD</span>
            </div>
            <div className="border-border bg-muted/40 flex items-center gap-1 rounded-lg border p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(tier.id, (quantities[tier.id] || 0) - 1)}
                className="hover:bg-muted/50 text-muted-foreground h-8 w-8 rounded-md"
                aria-label="Smanji količinu"
              >
                <Icon name="remove" className="text-[14px]" />
              </Button>
              <span className="text-foreground w-8 text-center text-sm font-black select-none">
                {quantities[tier.id] || 0}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setQuantity(
                    tier.id,
                    Math.min(MAX_QUANTITY_PER_ITEM, (quantities[tier.id] || 0) + 1),
                  )
                }
                className="hover:bg-muted/50 text-muted-foreground h-8 w-8 rounded-md"
                aria-label="Povećaj količinu"
              >
                <Icon name="add" className="text-[14px]" />
              </Button>
            </div>
            <Button
              onClick={() => onAdd(tier)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full rounded-lg text-[9px] font-black tracking-widest uppercase"
            >
              Dodaj
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
