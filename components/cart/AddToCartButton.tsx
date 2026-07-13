"use client";
import { Icon } from "@/components/ui/Icon";

import { useUIState } from "@/hooks/use-ui-state";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { trackAddToCart } from "@/lib/analytics/events";
import { addToCartAction } from "@/app/(server)/actions/cart";
import type { CartItem } from "@/lib/types/cart";

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
  const openCart = useUIState((state) => state.openCart);
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 🛒 Add to server cart directly
    addToCartAction({
      ticketPriceId: ticket.id,
      facilityId: ticket.facility.id,
      quantity: 1,
      title: ticket.title,
      price: Number(ticket.price),
      currency: ticket.currency,
      facilityName: ticket.facility.name,
      category: ticket.facility.category,
      validityType: ticket.validityType,
      requiresIdentity: ticket.requiresIdentity,
      requiresPhoto: ticket.requiresPhoto,
      minPeople: ticket.minPeople,
      maxPeople: ticket.maxPeople,
      imageUrl: ticket.imageUrl,
    }).catch(console.error);

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
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }

    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      onClick={handleAdd}
      className={cn(
        "relative z-30 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 active:scale-95",
        added
          ? "scale-110 bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          : "hover:bg-primary bg-white/5 text-slate-100 hover:scale-110 hover:text-slate-950",
        className,
      )}
      title={added ? "Dodato" : "Dodaj u korpu"}
      aria-label={added ? `Usponešno dodato: ${ticket.title}` : `Dodaj ${ticket.title} u korpu`}
      aria-live="polite"
    >
      {added ? (
        <Icon name="check" className="text-[24px]" />
      ) : (
        <Icon name="shopping_cart" className="text-[20px]" />
      )}
    </button>
  );
}
