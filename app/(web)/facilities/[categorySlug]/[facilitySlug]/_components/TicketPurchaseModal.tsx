"use client";
import { Icon } from "@/components/ui/Icon";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    titleSr: string | null;
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
    descriptionSr: string | null;
    label: string;
    labelSr: string | null;
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
  labelSr: string | null;
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
  titleSr: string | null;
  label: string | null;
  labelSr: string | null;
  requiresIdentity: boolean;
  requiresPhoto: boolean;
  minPeople: number;
  maxPeople: number | null;
  isSeasonPass: boolean;
  validityType: string;
  prices: PriceOption[];
}

interface CategoryOption {
  id: string;
  title: string;
  titleSr: string | null;
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
  const facilityName = facility?.name || activeProduct?.title || "";
  const facilityId = facility?.id || "";

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
      imageUrl: null,
    });

    setIsAdding(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([15, 80, 15]);
    await new Promise((r) => setTimeout(r, 700));
    setIsAdding(false);
    setIsAdded(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsAdded(false);
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
      imageUrl: null,
    });

    onClose();
    router.push("/cart");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-background/95 backdrop-blur-md pointer-events-auto animate-fade-in" />

      {/* Modal Container */}
      <div ref={modalRef} className="relative w-full max-w-lg md:max-w-xl z-10 overflow-visible animate-fade-in-up">
        <Card className="p-8 md:p-10 overflow-visible border-border relative z-10 flex flex-col gap-6 bg-card shadow-2xl rounded-3xl">

          {/* Decorative glow */}
          <div className="absolute -top-12 left-1/4 right-1/4 h-24 bg-primary/10 rounded-full blur-[50px] pointer-events-none z-0" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-muted/10 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 active:scale-90 transition-all z-30 shadow-sm"
            aria-label="Zatvori"
          >
            <Icon name="close" className="text-[18px]" />
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : !activeProduct ? (
            <>
              {/* Step 1: Pick Category + Product */}
              <div className="space-y-4 z-10">
                <h2 className="text-xl font-black text-foreground tracking-tight uppercase leading-tight">
                  {facility?.name || "Izaberite kartu"}
                </h2>

                {/* Category tabs */}
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

                {/* Product cards */}
                <div className="grid gap-3">
                  {activeCategory?.products.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod.id);
                        setQuantity(prod.minPeople || 1);
                      }}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${
                        selectedProduct === prod.id
                          ? "bg-primary/5 border-primary/30"
                          : "bg-muted/5 border-border hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">{prod.title}</span>
                        <span className="text-lg font-black text-foreground">
                          od {Math.min(...prod.prices.map((p) => p.price)).toLocaleString("sr-RS")} RSD
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {prod.prices.map((p) => (
                          <span key={p.id} className="text-[9px] px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground">
                            {DAY_LABELS[p.dayType ?? "ALL"]} — {TIME_LABELS[p.timeSlot ?? "FULL_DAY"]}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Price Selection + Quantity */}
              <div className="space-y-4 z-10">
                {/* Header */}
                <div className="flex items-center gap-2">
                  {categories.length > 1 && (
                    <button onClick={() => setSelectedProduct(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all">
                      <Icon name="arrow_back" className="text-[16px]" />
                    </button>
                  )}
                  <div>
                    <h2 className="text-lg font-black text-foreground italic tracking-tight uppercase leading-tight">
                      {activeProduct.title}
                    </h2>
                    {facility?.name && (
                      <span className="text-[10px] font-bold text-primary tracking-widest uppercase">{facility.name}</span>
                    )}
                  </div>
                </div>

                {/* Price options */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Izaberite varijantu</span>
                  {activeProduct.prices.map((p) => {
                    const isSelected = activePrice?.id === p.id;
                    const hasDiscount = p.originalPrice && p.originalPrice > p.price;
                    const dayLabel = DAY_LABELS[p.dayType ?? "ALL"];
                    const timeLabel = TIME_LABELS[p.timeSlot ?? "FULL_DAY"];
                    const displayLabel = p.label || `${dayLabel} — ${timeLabel}`;

                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPrice(p.id)}
                        className={`w-full text-left rounded-xl border p-3 flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-primary/5 border-primary/40"
                            : "bg-muted/5 border-border hover:border-primary/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected ? "border-primary" : "border-muted-foreground/30"
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <span className="text-xs font-bold text-foreground">{displayLabel}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-black text-foreground">{p.price.toLocaleString("sr-RS")}</span>
                          <span className="text-[9px] font-bold text-primary">RSD</span>
                          {hasDiscount && (
                            <span className="text-[9px] text-muted-foreground line-through ml-1">
                              {p.originalPrice?.toLocaleString("sr-RS")}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Količina</span>
                  <div className="flex items-center bg-muted/60 rounded-2xl p-1 border border-border shadow-inner">
                    <button
                      onClick={() => setQuantity(Math.max(activeProduct.minPeople, quantity - 1))}
                      className="w-9 h-9 flex items-center justify-center hover:bg-muted/40 active:bg-muted/60 rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-90"
                      disabled={isAdding || isAdded || quantity <= activeProduct.minPeople}
                    >
                      <Icon name="remove" className="text-[14px]" />
                    </button>
                    <span className="w-10 text-center font-black text-foreground text-base select-none">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(activeProduct.maxPeople ?? MAX_QUANTITY_PER_ITEM, quantity + 1))}
                      className="w-9 h-9 flex items-center justify-center hover:bg-muted/40 active:bg-muted/60 rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-90"
                      disabled={isAdding || isAdded || quantity >= (activeProduct.maxPeople ?? MAX_QUANTITY_PER_ITEM)}
                    >
                      <Icon name="add" className="text-[14px]" />
                    </button>
                  </div>
                </div>

                {/* Total */}
                {activePrice && (
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ukupno</span>
                    <span className="text-xl font-black text-foreground">
                      {(activePrice.price * quantity).toLocaleString("sr-RS")} RSD
                    </span>
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3.5 z-10 w-full">
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
          )}
        </Card>
      </div>
    </div>
  );
}
