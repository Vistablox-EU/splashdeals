"use client";
import { Icon } from "@/components/ui/Icon";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart, MAX_QUANTITY_PER_ITEM } from "@/hooks/use-cart";
import { useUIState } from "@/hooks/use-ui-state";
import { useRouter } from "next/navigation";

interface TicketPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilitySlug: string;
  initialProductId?: string;

  // Legacy props — still accepted but unused when facilitySlug is provided
  ticket?: {
    id: string;
    title: string;
    price: number;
    originalPrice: number | null;
    dayType: string | null;
    timeSlot: string | null;
    minPeople: number;
    maxPeople: number | null;
    isSeasonPass: boolean;
    requiresIdentity: boolean;
    requiresPhoto: boolean;
    slug: string | null;
    description: string | null;
    label: string;
    imageUrl?: string | null;
  } | null;
  facility: {
    id: string;
    name: string;
    category: string;
    streetName?: string | null;
    streetNumber?: string | null;
    city?: string;
  } | null;
}

interface PriceOption {
  id: string;
  label: string | null;
  price: number;
  originalPrice: number | null;
  dayType: string | null;
  timeSlot: string | null;
  validFrom: string | null;
  validTo: string | null;
}

interface ProductOption {
  id: string;
  title: string;
  label: string | null;
  requiresIdentity: boolean;
  requiresPhoto: boolean;
  minPeople: number;
  maxPeople: number | null;
  isSeasonPass: boolean;
  validityType: string;
  imageUrl?: string | null;
  prices: PriceOption[];
}

interface CategoryOption {
  id: string;
  title: string;
  slug: string | null;
  products: ProductOption[];
}

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

export function TicketPurchaseModal({ isOpen, onClose, facilitySlug, initialProductId, ticket: _ticket, facility }: TicketPurchaseModalProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(initialProductId ?? null);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(true);

  const modalRef = useRef<HTMLDivElement>(null);

  const addItem = useCart((state) => state.addItem);
  const openCart = useUIState((state) => state.openCart);
  const router = useRouter();

  // Fetch hierarchy on open
  useEffect(() => {
    if (!isOpen) return;
    fetch(`/api/facilities/${facilitySlug}/tickets`)
      .then((r) => r.json())
      .then((data: CategoryOption[]) => {
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategory(data[0].id);
          // If initialProductId is given, select that product
          if (initialProductId) {
            for (const cat of data) {
              const found = cat.products.find((p) => p.id === initialProductId);
              if (found) {
                setSelectedProduct(found.id);
                setSelectedCategory(cat.id);
                setQuantity(found.minPeople || 1);
                break;
              }
            }
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isOpen, facilitySlug, initialProductId]);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) { last?.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first?.focus(); e.preventDefault(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Derive current selections
  const activeCategory = categories.find((c) => c.id === selectedCategory);
  const activeProduct = activeCategory?.products.find((p) => p.id === selectedProduct);
  const activePrice = activeProduct?.prices.find((p) => p.id === selectedPrice) ?? activeProduct?.prices[0] ?? null;
  const showCategoryPicker = categories.length > 1;

  // Auto-select the best deal variation (highest discount %)
  useEffect(() => {
    if (!activeProduct) return;
    const best = activeProduct.prices
      .filter((p) => p.originalPrice && p.originalPrice > p.price)
      .sort((a, b) => {
        const aPct = ((Number(a.originalPrice) - Number(a.price)) / Number(a.originalPrice)) * 100;
        const bPct = ((Number(b.originalPrice) - Number(b.price)) / Number(b.originalPrice)) * 100;
        return bPct - aPct;
      })[0];
    if (best && !selectedPrice) {
      setSelectedPrice(best.id);
    }
  }, [activeProduct, selectedPrice]);

  // Best deal ID for highlighting in the variation list
  const bestDealId = (() => {
    if (!activeProduct) return null;
    const best = activeProduct.prices
      .filter((p) => p.originalPrice && p.originalPrice > p.price)
      .sort((a, b) => {
        const aPct = ((Number(a.originalPrice) - Number(a.price)) / Number(a.originalPrice)) * 100;
        const bPct = ((Number(b.originalPrice) - Number(b.price)) / Number(b.originalPrice)) * 100;
        return bPct - aPct;
      })[0];
    return best?.id ?? null;
  })();
  const handleAddToCart = async () => {
    if (!activePrice || !activeProduct || !facility) return;

    addItem({
      ticketId: activePrice.id,
      facilityId: facility.id,
      facilityName: facility.name,
      category: facility.category,
      quantity,
      title: `${facility.name} - ${activeProduct.title}${activePrice.label ? ` (${activePrice.label})` : ""}`,
      price: activePrice.price,
      currency: "RSD",
      requiresIdentity: activeProduct.requiresIdentity,
      requiresPhoto: activeProduct.requiresPhoto,
      validityType: activeProduct.isSeasonPass ? "SUMMER_SEASON" : "FLEXIBLE_30_DAY",
      minPeople: activeProduct.minPeople,
      maxPeople: activeProduct.maxPeople,
      imageUrl: activeProduct.imageUrl || null,
    });

    setIsAdding(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([15, 80, 15]);
    await new Promise((r) => setTimeout(r, 700));
    setIsAdding(false);
    setIsAdded(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsAdded(false);
    setClosing(true);
    await new Promise((r) => setTimeout(r, 300));
    setClosing(false);
    onClose();
    openCart();
  };

  const handleCheckout = () => {
    if (!activePrice || !activeProduct || !facility) return;

    addItem({
      ticketId: activePrice.id,
      facilityId: facility.id,
      facilityName: facility.name,
      category: facility.category,
      quantity,
      title: `${facility.name} - ${activeProduct.title}${activePrice.label ? ` (${activePrice.label})` : ""}`,
      price: activePrice.price,
      currency: "RSD",
      requiresIdentity: activeProduct.requiresIdentity,
      requiresPhoto: activeProduct.requiresPhoto,
      validityType: activeProduct.isSeasonPass ? "SUMMER_SEASON" : "FLEXIBLE_30_DAY",
      minPeople: activeProduct.minPeople,
      maxPeople: activeProduct.maxPeople,
      imageUrl: activeProduct.imageUrl || null,
    });

    onClose();
    router.push("/cart");
  };

  // ─── Shared Content ──────────────────────────────────────────────

  const renderLoading = () => (
    <div className="flex items-center justify-center py-16">
      <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  const renderProductSelection = () => (
    <>
      {showCategoryPicker && (
        <div className="flex gap-1 p-1 rounded-xl bg-muted/20 border border-border">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setSelectedProduct(null); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                selectedCategory === cat.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>
      )}

      <div className="divide-y divide-border/40">
        {activeCategory?.products.map((prod) => (
          <button
            key={prod.id}
            onClick={() => {
              setSelectedProduct(prod.id);
              setQuantity(prod.minPeople || 1);
            }}
            className="w-full text-left py-3 flex items-center justify-between transition-colors hover:bg-muted/10 active:bg-muted/20"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                selectedProduct === prod.id ? "border-primary" : "border-muted-foreground/30"
              }`}>
                {selectedProduct === prod.id && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm font-bold text-foreground">{prod.title}</span>
            </div>
            <span className="text-xs font-black text-primary shrink-0">
              od {Math.min(...prod.prices.map((p) => p.price)).toLocaleString("sr-RS")} RSD
            </span>
          </button>
        ))}
      </div>
    </>
  );

  const renderVariationSelection = () => (
    <>
      {/* Back + title */}
      <div className="flex items-center gap-2">
        {categories.length > 1 && (
          <button onClick={() => setSelectedProduct(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all">
            <Icon name="arrow_back" className="text-[14px]" />
          </button>
        )}
        <div>
          <h3 className="text-sm font-black text-foreground italic tracking-tight uppercase">{activeProduct!.title}</h3>
          {facility?.name && (
            <span className="text-[9px] font-bold text-primary tracking-widest uppercase">{facility.name}</span>
          )}
        </div>
      </div>

      {/* Price variations */}
      <div>
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pb-2 block">Izaberite varijantu</span>
        <div className="divide-y divide-border/40">
          {activeProduct!.prices.map((p) => {
            const isSelected = activePrice?.id === p.id;
            const hasDiscount = p.originalPrice && p.originalPrice > p.price;
            const discountPct = hasDiscount ? Math.round(((Number(p.originalPrice) - Number(p.price)) / Number(p.originalPrice)) * 100) : 0;
            const dayLabel = DAY_LABELS[p.dayType ?? "ALL"];
            const timeLabel = TIME_LABELS[p.timeSlot ?? "FULL_DAY"];
            const displayLabel = p.label || `${dayLabel} — ${timeLabel}`;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedPrice(p.id)}
                className={`w-full text-left py-3 flex items-center justify-between transition-colors ${
                  isSelected ? "bg-primary/[0.02]" : "hover:bg-muted/10 active:bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSelected ? "border-primary" : "border-muted-foreground/30"
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-foreground block truncate">{displayLabel}</span>
                    {hasDiscount && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                        Ušteda {discountPct}%
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
                  {hasDiscount && (
                    <span className="text-[8px] text-muted-foreground line-through ml-0.5">
                      {p.originalPrice?.toLocaleString("sr-RS")}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Količina</span>
        <div className="flex items-center bg-muted/60 rounded-2xl p-1 border border-border shadow-inner">
          <button
            onClick={() => setQuantity(Math.max(activeProduct!.minPeople, quantity - 1))}
            className="w-9 h-9 flex items-center justify-center hover:bg-muted/40 active:bg-muted/60 rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-90"
            disabled={isAdding || isAdded || quantity <= activeProduct!.minPeople}
          >
            <Icon name="remove" className="text-[14px]" />
          </button>
          <span className="w-10 text-center font-black text-foreground text-base select-none">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(activeProduct!.maxPeople ?? MAX_QUANTITY_PER_ITEM, quantity + 1))}
            className="w-9 h-9 flex items-center justify-center hover:bg-muted/40 active:bg-muted/60 rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-90"
            disabled={isAdding || isAdded || quantity >= (activeProduct!.maxPeople ?? MAX_QUANTITY_PER_ITEM)}
          >
            <Icon name="add" className="text-[14px]" />
          </button>
        </div>
      </div>

      {/* Total */}
      {activePrice && (
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ukupno</span>
          <span className="text-xl font-black text-foreground">
            {(activePrice.price * quantity).toLocaleString("sr-RS")} RSD
          </span>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3.5 w-full">
        <Button
          onClick={handleCheckout}
          disabled={isAdding || isAdded || !activePrice}
          className="w-full h-14 text-xs font-black tracking-[0.2em] uppercase flex items-center justify-center gap-2 shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
        >
          <span>Kupi Odmah (1-Klik)</span>
          <Icon name="bolt" className="text-[16px] fill-current animate-pulse" />
        </Button>

        <button
          onClick={handleAddToCart}
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
            <><svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span>Dodavanje...</span></>
          ) : (
            <><Icon name="shopping_bag" className="text-[16px]" /><span>Dodaj u korpu</span></>
          )}
        </button>
      </div>
    </>
  );

  const renderContent = () => {
    if (loading) return renderLoading();
    if (!activeProduct) return renderProductSelection();
    return renderVariationSelection();
  };

  // ─── Render ──────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
        <div onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in pointer-events-auto" />
        <div ref={modalRef} className={cn("relative z-10 bg-card rounded-t-3xl border border-border/50 shadow-2xl max-h-[85vh] flex flex-col pb-safe overflow-hidden", closing ? "animate-fade-out-up" : "animate-slide-up")}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/30 shrink-0">
            <h2 className="text-base font-black text-foreground tracking-tight uppercase leading-tight">
              {facility?.name || "Izaberite kartu"}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted/20 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all shrink-0"
              aria-label="Zatvori"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Desktop: Centered Card */}
      <div className="hidden md:fixed md:inset-0 md:z-50 md:flex md:items-center md:justify-center md:p-6">
        <div onClick={onClose} className="absolute inset-0 bg-background/95 backdrop-blur-md animate-fade-in pointer-events-auto" />
        <div ref={modalRef} className={cn("relative w-full max-w-lg md:max-w-xl z-10 animate-fade-in-up", closing && "scale-95 opacity-0 transition-all duration-300")}>
          <Card className="p-8 md:p-10 overflow-visible border-border relative z-10 flex flex-col gap-6 bg-card shadow-2xl rounded-3xl">
            <div className="absolute -top-12 left-1/4 right-1/4 h-24 bg-primary/10 rounded-full blur-[50px] pointer-events-none z-0" />
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-muted/10 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 active:scale-90 transition-all z-30 shadow-sm"
              aria-label="Zatvori"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
            {renderContent()}
          </Card>
        </div>
      </div>
    </>
  );
}
