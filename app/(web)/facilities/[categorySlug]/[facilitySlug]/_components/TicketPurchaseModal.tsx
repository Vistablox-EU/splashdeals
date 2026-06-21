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
  ticket: {
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
  };
}

interface DateOption {
  dateStr: string;
  dayName: string;
  dayNum: number;
  monthName: string;
}

function getAvailableDates(dayType: string): DateOption[] {
  const dates: DateOption[] = [];
  const now = new Date();
  
  const dayNamesSr = ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"];
  const monthNamesSr = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Avg", "Sep", "Okt", "Nov", "Dec"];

  let daysCount = 0;
  let offset = 0;
  
  while (daysCount < 7 && offset < 30) {
    const d = new Date();
    d.setDate(now.getDate() + offset);
    const dayOfWeek = d.getDay();
    
    let isValid = true;
    if (dayType === 'WEEKDAY') {
      isValid = dayOfWeek >= 1 && dayOfWeek <= 5;
    } else if (dayType === 'WEEKEND') {
      isValid = dayOfWeek === 0 || dayOfWeek === 6;
    }
    
    if (isValid) {
      const dayNum = d.getDate();
      const dayName = dayNamesSr[dayOfWeek];
      const monthName = monthNamesSr[d.getMonth()];
      const dateStr = `${dayNum.toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
      
      dates.push({
        dateStr,
        dayName,
        dayNum,
        monthName
      });
      daysCount++;
    }
    offset++;
  }
  
  return dates;
}

export function TicketPurchaseModal({ isOpen, onClose, ticket, facility }: TicketPurchaseModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const addItem = useCart((state) => state.addItem);
  const openCart = useUIState((state) => state.openCart);
  const router = useRouter();

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
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (firstElement) {
      firstElement.focus();
    }
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Sync quantity with ticket's min/maxPeople when modal opens
  useEffect(() => {
    if (ticket) {
      const min = ticket.minPeople || 1;
      const max = ticket.maxPeople ?? MAX_QUANTITY_PER_ITEM;
      setQuantity(Math.min(max, Math.max(min, 1)));
      setSelectedDate("");
    }
  }, [ticket]);

  // Generate date options based on ticket configuration
  const availableDates = ticket ? getAvailableDates(ticket.dayType ?? "ALL") : [];

  // Derive active selected date. If current selectedDate is not available or empty, fall back to the first available date.
  const activeDate = selectedDate && availableDates.some((d) => d.dateStr === selectedDate)
    ? selectedDate
    : (availableDates[0]?.dateStr || "");

  if (!ticket || !facility) return null;

  const price = Number(ticket.price);
  const originalPrice = ticket.originalPrice ? Number(ticket.originalPrice) : null;
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleQuantityChange = (q: number) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
    const min = ticket?.minPeople || 1;
    const max = ticket?.maxPeople ?? MAX_QUANTITY_PER_ITEM;
    setQuantity(Math.max(min, Math.min(max, q)));
  };

  const handleDateSelect = (dateStr: string) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(8);
    }
    setSelectedDate(dateStr);
  };

  const handleCheckout = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([20, 100, 20]);
    }

    addItem({
      ticketId: ticket.id,
      facilityId: facility.id,
      facilityName: facility.name,
      category: facility.category,
      quantity,
      title: `${facility.name} - ${ticket.labelSr || ticket.label || ticket.titleSr || ticket.title}${activeDate ? ` (${activeDate})` : ''}`,
      price,
      currency: "RSD",
      requiresIdentity: ticket.requiresIdentity,
      requiresPhoto: ticket.requiresPhoto,
      validityType: ticket.isSeasonPass ? "SUMMER_SEASON" : "FLEXIBLE_30_DAY",
      minPeople: ticket.minPeople,
      maxPeople: ticket.maxPeople,
      imageUrl: ticket.imageUrl,
    });

    onClose();
    router.push("/cart");
  };

  const handleAddToCart = async () => {
    // Add to cart FIRST — instant, synchronous
    addItem({
      ticketId: ticket.id,
      facilityId: facility.id,
      facilityName: facility.name,
      category: facility.category,
      quantity,
      title: `${facility.name} - ${ticket.labelSr || ticket.label || ticket.titleSr || ticket.title}${activeDate ? ` (${activeDate})` : ''}`,
      price,
      currency: "RSD",
      requiresIdentity: ticket.requiresIdentity,
      requiresPhoto: ticket.requiresPhoto,
      validityType: ticket.isSeasonPass ? "SUMMER_SEASON" : "FLEXIBLE_30_DAY",
      minPeople: ticket.minPeople,
      maxPeople: ticket.maxPeople,
      imageUrl: ticket.imageUrl,
    });

    setIsAdding(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([15, 80, 15]);
    }

    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsAdding(false);
    setIsAdded(true);

    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsAdded(false);
    onClose();
    openCart();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={onClose}
            className="absolute inset-0 bg-background/95 backdrop-blur-md pointer-events-auto animate-fade-in"
          />

          {/* Modal Container */}
          <div
            ref={modalRef}
            className="relative w-full max-w-lg md:max-w-xl z-10 overflow-visible animate-fade-in-up"
          >
            <Card className="p-8 md:p-10 overflow-visible border-border relative z-10 flex flex-col gap-6 bg-gradient-to-br from-slate-900/95 via-slate-950/90 to-cyan-950/20 shadow-[0_30px_70px_rgba(0,0,0,0.85),_0_0_50px_rgba(6,182,212,0.05)] rounded-[2.2rem]">
              
              {/* Decorative Top Glow (No Purple!) */}
              <div className="absolute -top-12 left-1/4 right-1/4 h-24 bg-primary/10 rounded-full blur-[50px] pointer-events-none z-0" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 border border-border flex items-center justify-center text-slate-400 hover:text-foreground hover:bg-white/10 active:scale-90 transition-all z-30 shadow-sm"
                aria-label="Zatvori"
              >
                <Icon name="close" className="text-[18px]" />
              </button>

              {/* Ticket Identity */}
              <div className="space-y-3.5 z-10 pr-8">
                {/* Header Row: Facility Name & Savings Badge */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Icon name="auto_awesome" className="text-[14px] text-cyan-400" />
                    <span className="text-xs font-black text-cyan-400 uppercase tracking-widest leading-none">
                      {facility.name}
                    </span>
                  </div>
                  {hasDiscount && (
                    <span className="bg-gradient-to-r from-rose-500 to-orange-500 text-foreground font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse shrink-0">
                      Ušteda {discountPercent}%
                    </span>
                  )}
                </div>
                
                <h2 className="text-2xl md:text-3xl font-black text-foreground italic tracking-tight uppercase leading-tight">
                  {ticket.labelSr || ticket.label || ticket.titleSr || ticket.title}
                </h2>

                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold bg-white/[0.02] border border-border px-3 py-1.5 rounded-xl w-fit">
                  <Icon name="location_on" className="text-[14px] text-cyan-500/80" />
                  <span>{facility.streetName} {facility.streetNumber}, {facility.city}</span>
                </div>
              </div>

              {/* Fine Print Details Grid */}
              <div className="grid grid-cols-2 gap-4 z-10">
                <div className="group/detail bg-white/[0.03] hover:bg-white/[0.06] border border-border hover:border-cyan-500/30 rounded-2xl p-4 flex flex-col gap-2 transition-all duration-300 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Dani Korišćenja</span>
                  <div className="flex items-center gap-2 text-slate-100 font-bold text-xs">
                    <div className="p-1 rounded-lg bg-primary/10 text-primary group-hover/detail:bg-primary/20 group-hover/detail:scale-110 transition-all duration-300">
                      <Icon name="calendar_month" className="text-[14px]" />
                    </div>
                    <span>
                      {ticket.dayType === 'WEEKDAY' ? 'Samo Radni Dan' : ticket.dayType === 'WEEKEND' ? 'Samo Vikend' : 'Svi Dani u Nedelji'}
                    </span>
                  </div>
                </div>

                <div className="group/detail bg-white/[0.03] hover:bg-white/[0.06] border border-border hover:border-cyan-500/30 rounded-2xl p-4 flex flex-col gap-2 transition-all duration-300 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Termin Ulaska</span>
                  <div className="flex items-center gap-2 text-slate-100 font-bold text-xs">
                    <div className="p-1 rounded-lg bg-primary/10 text-primary group-hover/detail:bg-primary/20 group-hover/detail:scale-110 transition-all duration-300">
                      <Icon name="schedule" className="text-[14px]" />
                    </div>
                    <span>
                      {ticket.timeSlot === 'AFTERNOON' ? 'Poslepodne (od 16h)' : 'Celodnevni pristup'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Date Picker Segment */}
              {availableDates.length > 0 && (
                <div className="space-y-2.5 z-10">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Izaberite Datum Posete</span>
                  <div className="relative">
                    {/* Left fade affordance */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none rounded-l-xl" />
                    {/* Right fade affordance */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none rounded-r-xl" />
                    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
                      {availableDates.map((d) => {
                        const isSelected = activeDate === d.dateStr;
                        return (
                          <button
                            key={d.dateStr}
                            onClick={() => handleDateSelect(d.dateStr)}
                            className={`flex-shrink-0 w-16 h-20 rounded-xl border flex flex-col items-center justify-center gap-1 snap-start transition-all duration-300 ${
                              isSelected
                                ? "bg-primary/10 border-primary/40 text-primary shadow-lg scale-102"
                                : "bg-muted/20 border-border text-muted-foreground hover:text-foreground/80 hover:border-border hover:bg-muted/40"
                            }`}
                          >
                            <span className="text-[8px] font-black uppercase tracking-wider">{d.dayName}</span>
                            <span className="text-lg font-black tracking-tight">{d.dayNum}</span>
                            <span className="text-[8px] font-black uppercase tracking-wider opacity-80">{d.monthName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Perforated Separator Row */}
              <div className="relative -mx-8 md:-mx-10 flex items-center justify-center my-2 select-none pointer-events-none">
                {/* Left Notch cutout (semi-circle bulging in) */}
                <div className="absolute left-0 w-3.5 h-7 bg-background rounded-r-full border-y border-r border-border -translate-x-px z-20 shadow-[inset_-3px_0_5px_rgba(0,0,0,0.8)]" />
                
                {/* Dashed Line */}
                <div className="w-full border-t border-dashed border-white/15" />
                
                {/* Right Notch cutout (semi-circle bulging in) */}
                <div className="absolute right-0 w-3.5 h-7 bg-background rounded-l-full border-y border-l border-border translate-x-px z-20 shadow-[inset_3px_0_5px_rgba(0,0,0,0.8)]" />
              </div>

              {/* Price & Quantity Panel */}
              <div className="flex items-center justify-between gap-6 z-10 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cena ulaznice</span>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-4xl font-black text-foreground tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-100 bg-clip-text text-transparent">
                      {price}
                    </span>
                    <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">RSD</span>

                    {hasDiscount && (
                      <span className="text-xs font-bold text-slate-500 line-through decoration-rose-500/80 ml-2 opacity-70">
                        {originalPrice} RSD
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity control */}
                <div className="flex items-center bg-muted/60 rounded-2xl p-1 border border-border shadow-inner shrink-0">
                  <button 
                    onClick={() => handleQuantityChange(quantity - 1)} 
                    className="w-9 h-9 flex items-center justify-center hover:bg-white/5 active:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-foreground active:scale-90"
                    aria-label="Smanji količinu"
                    disabled={isAdding || isAdded}
                  >
                    <Icon name="remove" className="text-[14px]" />
                  </button>
                  <span className="w-8 text-center font-black text-foreground text-base select-none">{quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(quantity + 1)} 
                    className="w-9 h-9 flex items-center justify-center hover:bg-white/5 active:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-foreground active:scale-90"
                    aria-label="Povećaj količinu"
                    disabled={isAdding || isAdded}
                  >
                    <Icon name="add" className="text-[14px]" />
                  </button>
                </div>
              </div>

              {/* Dynamic Urgency Callout */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-400 text-[10px] font-bold tracking-wide z-10 select-none">
                <Icon name="bolt" className="text-[14px] animate-pulse text-amber-500 shrink-0" />
                <span>Visoka potražnja: Osigurajte svoje mesto na vreme za izabrani datum!</span>
              </div>

              {/* Checkout Trigger CTA stack */}
              <div className="flex flex-col gap-3.5 z-10 w-full">
                <Button 
                  onClick={handleCheckout} 
                  disabled={isAdding || isAdded}
                  className="w-full h-14 text-xs font-black tracking-[0.2em] uppercase flex items-center justify-center gap-2 shadow-[0_4px_30px_rgba(6,182,212,0.25)] bg-primary text-black hover:bg-primary/90 rounded-full"
                >
                  <>
                    <span>Kupi Odmah (1-Klik)</span>
                    <Icon name="bolt" className="text-[16px] fill-current animate-pulse" />
                  </>
                </Button>

                <button 
                  onClick={handleAddToCart} 
                  disabled={isAdding || isAdded}
                  className={`w-full h-12 rounded-2xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    isAdded
                      ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
                      : isAdding
                        ? "border-cyan-500/10 bg-cyan-950/5 text-cyan-400 cursor-not-allowed"
                        : "border-primary/20 bg-primary/15 text-primary hover:bg-primary/10 hover:border-primary/40 hover:text-primary/80 active:scale-98"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Icon name="check" className="text-[16px] animate-scale-in" />
                      <span>Dodato u korpu!</span>
                    </>
                  ) : isAdding ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Dodavanje...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="shopping_bag" className="text-[16px]" /> 
                      <span>Dodaj u korpu</span>
                    </>
                  )}
                </button>
              </div>

            </Card>
          </div>
        </div>
      )}
    </>
  );
}
