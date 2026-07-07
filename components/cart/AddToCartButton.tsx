'use client';
import { Icon } from "@/components/ui/Icon";

import { useCart } from "@/hooks/use-cart";
import { useUIState } from "@/hooks/use-ui-state";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { trackAddToCart } from "@/lib/analytics/events";

interface AddToCartButtonProps {
  ticket: {
    id: string;
    title: string;
    price: number | string;
    currency: string;
    validityType: string;
    requiresIdentity?: boolean;
    requiresPhoto?: boolean;
    minPeople?: number;
    maxPeople?: number | null;
    imageUrl?: string | null;
    facility: {
      id: string;
      name: string;
      category: string;
    };
  };
  className?: string;
}

export function AddToCartButton({ ticket, className }: AddToCartButtonProps) {
  const addItem = useCart((state) => state.addItem);
  const openCart = useUIState((state) => state.openCart);
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      ticketId: ticket.id,
      facilityId: ticket.facility.id,
      facilityName: ticket.facility.name,
      category: ticket.facility.category,
      quantity: 1,
      title: ticket.title,
      price: Number(ticket.price),
      currency: ticket.currency,
      validityType: ticket.validityType,
      requiresIdentity: ticket.requiresIdentity,
      requiresPhoto: ticket.requiresPhoto,
      minPeople: ticket.minPeople,
      maxPeople: ticket.maxPeople,
      imageUrl: ticket.imageUrl,
    });
    trackAddToCart({
      ticketId: ticket.id,
      facilityName: ticket.facility.name,
      ticketTitle: ticket.title,
      price: Number(ticket.price),
      quantity: 1,
    });
    setAdded(true);
    openCart();
    
    // 📳 Haptic Feedback (PWA standard)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
    
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button 
      onClick={handleAdd}
      className={cn(
        "relative z-30 h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95",
        added 
          ? "bg-emerald-500 text-slate-950 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.4)]" 
          : "bg-white/5 text-slate-100 hover:bg-primary hover:text-slate-950 hover:scale-110",
        className
      )}
      title={added ? "Dodato" : "Dodaj u korpu"}
      aria-label={added ? `Usponešno dodato: ${ticket.title}` : `Dodaj ${ticket.title} u korpu`}
      aria-live="polite"
    >
       {added ? <Icon name="check" className="text-[24px]" /> : <Icon name="shopping_cart" className="text-[20px]" />}
    </button>
  );
}
