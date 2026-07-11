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

export function TicketPurchaseModal({
  isOpen,
  onClose,
  facilitySlug,
  initialProductId,
  ticket: _ticket,
  facility,
}: TicketPurchaseModalProps) {
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

  // Helper: find the best discount price in a product's prices
  const findBestDeal = (prices: PriceOption[]) => {
    const best = [...prices]
      .filter((p) => p.originalPrice && p.originalPrice > p.price)
      .sort((a, b) => {
        const aPct = ((Number(a.originalPrice) - Number(a.price)) / Number(a.originalPrice)) * 100;
        const bPct = ((Number(b.originalPrice) - Number(b.price)) / Number(b.originalPrice)) * 100;
        return bPct - aPct;
      })[0];
    return best?.id ?? prices[0]?.id ?? null;
  };

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
                setSelectedPrice(findBestDeal(found.prices));
                break;
              }
            }
          } else {
            // Auto-select first product's best deal
            const firstProd = data[0].products[0];
            if (firstProd) {
              setSelectedPrice(findBestDeal(firstProd.prices));
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
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        last?.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first?.focus();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, selectedCategory, selectedProduct, loading]);

  // Derive current selections
  const activeCategory = categories.find((c) => c.id === selectedCategory);
  const activeProduct = activeCategory?.products.find((p) => p.id === selectedProduct);
  const activePrice =
    activeProduct?.prices.find((p) => p.id === selectedPrice) ?? activeProduct?.prices[0] ?? null;
  const showCategoryPicker = categories.length > 1;

  // Best deal ID for highlighting in the variation list
  const bestDealId = activeProduct ? findBestDeal(activeProduct.prices) : null;
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

  const renderLoading = () => (
    <div className="flex items-center justify-center py-16">
      <Icon name="refresh" className="text-primary size-6 animate-spin" />
    </div>
  );

  const renderProductSelection = () => (
    <>
      {showCategoryPicker && (
        <div className="bg-muted/20 border-border flex gap-1 rounded-xl border p-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedProduct(null);
              }}
              className={`flex-1 rounded-lg py-2 text-[10px] font-black tracking-widest uppercase transition-[background-color,color] ${
                selectedCategory === cat.id
                  ? "bg-primary/10 text-primary border-primary/20 border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>
      )}

      <div className="divide-border/40 divide-y">
        {activeCategory?.products.map((prod) => (
          <button
            key={prod.id}
            onClick={() => {
              setSelectedProduct(prod.id);
              setQuantity(prod.minPeople || 1);
              setSelectedPrice(findBestDeal(prod.prices));
            }}
            className="hover:bg-muted/10 active:bg-muted/20 flex w-full items-center justify-between py-3 text-left transition-colors"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-[border-color] ${
                  selectedProduct === prod.id ? "border-primary" : "border-muted-foreground/30"
                }`}
              >
                {selectedProduct === prod.id && <div className="bg-primary h-2 w-2 rounded-full" />}
              </div>
              <span className="text-foreground text-sm font-bold">{prod.title}</span>
            </div>
            <span className="text-primary shrink-0 text-xs font-black">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedProduct(null)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/20 h-7 w-7 rounded-lg"
            aria-label="Nazad"
          >
            <Icon name="arrow_back" className="text-[14px]" />
          </Button>
        )}
        <div>
          <h3 className="text-foreground text-sm font-black tracking-tight uppercase italic">
            {activeProduct!.title}
          </h3>
          {facility?.name && (
            <span className="text-primary text-[9px] font-bold tracking-widest uppercase">
              {facility.name}
            </span>
          )}
        </div>
      </div>

      {/* Price variations */}
      <div>
        <span className="text-muted-foreground block pb-2 text-[9px] font-black tracking-widest uppercase">
          Izaberite varijantu
        </span>
        <div className="divide-border/40 divide-y">
          {activeProduct!.prices.map((p) => {
            const isSelected = activePrice?.id === p.id;
            const hasDiscount = p.originalPrice && p.originalPrice > p.price;
            const discountPct = hasDiscount
              ? Math.round(
                  ((Number(p.originalPrice) - Number(p.price)) / Number(p.originalPrice)) * 100,
                )
              : 0;
            const dayLabel = DAY_LABELS[p.dayType ?? "ALL"];
            const timeLabel = TIME_LABELS[p.timeSlot ?? "FULL_DAY"];
            const displayLabel = p.label || `${dayLabel} — ${timeLabel}`;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedPrice(p.id)}
                className={`flex w-full items-center justify-between py-3 text-left transition-colors ${
                  isSelected ? "bg-primary/[0.02]" : "hover:bg-muted/10 active:bg-muted/20"
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-[border-color] ${
                      isSelected ? "border-primary" : "border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && <div className="bg-primary h-2 w-2 rounded-full" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-foreground block truncate text-sm font-bold">
                      {displayLabel}
                    </span>
                    {hasDiscount && (
                      <span className="text-muted-foreground flex items-center gap-1 text-[9px]">
                        Ušteda {discountPct}%
                        {p.id === bestDealId && (
                          <span className="bg-secondary/20 text-secondary rounded-full px-1 py-[1px] text-[7px] leading-none font-black tracking-widest uppercase">
                            Najbolja ponuda
                          </span>
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
                  {hasDiscount && (
                    <span className="text-muted-foreground ml-0.5 text-[8px] line-through">
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
        <span className="text-muted-foreground text-[9px] font-black tracking-widest uppercase">
          Količina
        </span>
        <div className="bg-muted/60 border-border flex items-center rounded-2xl border p-1 shadow-inner">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuantity(Math.max(activeProduct!.minPeople, quantity - 1))}
            disabled={isAdding || isAdded || quantity <= activeProduct!.minPeople}
            className="hover:bg-muted/40 active:bg-muted/60 text-muted-foreground hover:text-foreground h-9 w-9 rounded-xl active:scale-90"
            aria-label="Smanji količinu"
          >
            <Icon name="remove" className="text-[14px]" />
          </Button>
          <span className="text-foreground w-10 text-center text-base font-black select-none">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setQuantity(Math.min(activeProduct!.maxPeople ?? MAX_QUANTITY_PER_ITEM, quantity + 1))
            }
            disabled={
              isAdding || isAdded || quantity >= (activeProduct!.maxPeople ?? MAX_QUANTITY_PER_ITEM)
            }
            className="hover:bg-muted/40 active:bg-muted/60 text-muted-foreground hover:text-foreground h-9 w-9 rounded-xl active:scale-90"
            aria-label="Povećaj količinu"
          >
            <Icon name="add" className="text-[14px]" />
          </Button>
        </div>
      </div>

      {/* Total */}
      {activePrice && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Ukupno
          </span>
          <span className="text-foreground text-xl font-black">
            {(activePrice.price * quantity).toLocaleString("sr-RS")} RSD
          </span>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex w-full flex-col gap-3.5">
        <Button
          onClick={handleAddToCart}
          disabled={isAdding || isAdded || !activePrice}
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl border text-[10px] font-black tracking-widest uppercase transition-[background-color,border-color,opacity] duration-300 ${
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
      <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
        <div
          onClick={onClose}
          role="presentation"
          className="bg-background/80 animate-fade-in pointer-events-auto absolute inset-0 backdrop-blur-sm"
        />
        <div
          ref={modalRef}
          className={cn(
            "bg-card border-border/50 pb-safe relative z-10 flex max-h-[85vh] flex-col overflow-hidden rounded-t-3xl border shadow-2xl",
            closing ? "animate-fade-out-up" : "animate-slide-up",
          )}
        >
          <div className="border-border/30 flex shrink-0 items-center justify-between border-b px-5 pt-5 pb-3">
            <h2 className="text-foreground text-base leading-tight font-black tracking-tight uppercase">
              {facility?.name || "Izaberite kartu"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="bg-muted/20 border-border text-muted-foreground hover:text-foreground h-11 w-11 rounded-full border"
              aria-label="Zatvori"
            >
              <Icon name="close" className="text-[16px]" />
            </Button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{renderContent()}</div>
        </div>
      </div>

      {/* Desktop: Centered Card */}
      <div className="hidden md:fixed md:inset-0 md:z-50 md:flex md:items-center md:justify-center md:p-6">
        <div
          onClick={onClose}
          role="presentation"
          className="bg-background/95 animate-fade-in pointer-events-auto absolute inset-0 backdrop-blur-md"
        />
        <div
          ref={modalRef}
          className={cn(
            "animate-fade-in-up relative z-10 w-full max-w-lg md:max-w-xl",
            closing && "scale-95 opacity-0 transition-[transform,opacity] duration-300",
          )}
        >
          <Card className="border-border bg-card relative z-10 flex flex-col gap-6 overflow-visible rounded-3xl p-8 shadow-2xl md:p-10">
            <div className="bg-primary/10 pointer-events-none absolute -top-12 right-1/4 left-1/4 z-0 h-24 rounded-full blur-[50px]" />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="bg-muted/10 border-border text-muted-foreground hover:text-foreground hover:bg-muted/20 absolute top-6 right-6 z-30 h-11 w-11 rounded-full border shadow-sm active:scale-90"
              aria-label="Zatvori"
            >
              <Icon name="close" className="text-[18px]" />
            </Button>
            {renderContent()}
          </Card>
        </div>
      </div>
    </>
  );
}
