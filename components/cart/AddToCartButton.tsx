"use client";
import { Icon } from "@/components/ui/Icon";

import { useUIState } from "@/hooks/use-ui-state";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { trackAddToCart } from "@/lib/analytics/events";
import { getClientDictionary } from "@/lib/client-dictionaries";
import type { Dict } from "@/lib/types";
import { persistCartItem } from "@/lib/cart/persist-cart-item";
import { useServerCart } from "@/hooks/use-server-cart";
import { broadcastCartUpdated } from "@/lib/cart/cart-sync";
import { openCartIfDesktop } from "@/lib/cart/open-cart-if-desktop";
import { toast } from "sonner";

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
  const refresh = useServerCart((state) => state.refresh);
  const [added, setAdded] = useState(false);
  const [dict, setDict] = useState<Dict | null>(null);

  useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const quantityToAdd = Math.max(1, ticket.minPeople ?? 1);
    const addedItem = await persistCartItem({
      ticketPriceId: ticket.id,
      quantity: quantityToAdd,
    });
    if (!addedItem) return;

    trackAddToCart({
      ticketId: addedItem.ticketId,
      facilityName: addedItem.facilityName || ticket.facility.name,
      ticketTitle: addedItem.title,
      price: addedItem.price,
      quantity: quantityToAdd,
    });

    await refresh();
    broadcastCartUpdated();

    setAdded(true);
    // Mobile: single cart destination is /cart (bottom nav). Desktop: open drawer.
    openCartIfDesktop(openCart);
    toast.success(dict?.product?.added_to_cart || "Dodato u korpu");

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
      title={
        added
          ? dict?.product?.added_to_cart || "Dodato"
          : dict?.product?.add_to_cart || "Dodaj u korpu"
      }
      aria-label={
        added
          ? (dict?.product?.added_aria || "Uspešno dodato: {title}").replace(
              "{title}",
              ticket.title,
            )
          : (dict?.product?.add_aria || "Dodaj {title} u korpu").replace("{title}", ticket.title)
      }
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
