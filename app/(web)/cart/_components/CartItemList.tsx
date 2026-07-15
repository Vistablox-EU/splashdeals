"use client";

import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/types/cart";
import type { CartItem } from "@/lib/types/cart";

interface CartItemListProps {
  items: CartItem[];
  dict: Record<string, any>;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  removedItems?: string[];
  changedItems?: string[];
}

export function CartItemList({
  items,
  dict,
  onQuantityChange,
  onRemove,
  removedItems = [],
  changedItems = [],
}: CartItemListProps) {
  const formatPrice = (price: number) => new Intl.NumberFormat("sr-RS").format(price);

  return (
    <>
      {/* Error state notices */}
      {removedItems.length > 0 && (
        <div className="bg-destructive/10 border-destructive/20 mb-4 rounded-xl border p-3 text-sm sm:p-4">
          <p className="text-destructive font-bold">
            {dict?.cart?.removed_notice || "Neke stavke više nisu dostupne i uklonjene su:"}
          </p>
          <ul className="text-destructive/80 mt-2 list-inside list-disc space-y-1">
            {removedItems.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      )}
      {changedItems.length > 0 && (
        <div className="border-warning/20 bg-warning/10 mb-4 rounded-xl border p-3 text-sm sm:p-4">
          <p className="text-warning font-bold">
            {dict?.cart?.price_changed_notice || "Cene su ažurirane:"}
          </p>
          <ul className="text-warning/80 mt-2 list-inside list-disc space-y-1">
            {changedItems.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </div>
      )}

      {items.map((item) => (
        <Card
          key={item.id}
          className="bg-muted/20 border-border flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
        >
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-6">
            {item.imageUrl && (
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 64px, 96px"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                {item.category || dict?.categories?.waterpark || "Akva Park"}
              </p>
              <h3 className="text-foreground mt-1 text-base leading-snug font-black tracking-tight sm:text-lg">
                {item.title}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">{item.facilityName}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="border-border bg-muted/30 flex items-center overflow-hidden rounded-xl border">
              <button
                type="button"
                onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                disabled={item.quantity <= (item.minPeople || 1)}
                aria-label={dict?.cart?.decrease_qty || "Smanji količinu"}
                className="text-muted-foreground hover:text-foreground flex h-11 w-11 items-center justify-center transition-colors disabled:opacity-30"
              >
                <Icon name="remove" className="text-[14px]" />
              </button>
              <span className="text-foreground min-w-[32px] text-center text-sm font-bold tabular-nums">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                disabled={
                  item.quantity >=
                  Math.min(item.maxPeople ?? MAX_QUANTITY_PER_ITEM, MAX_QUANTITY_PER_ITEM)
                }
                aria-label={dict?.cart?.increase_qty || "Povećaj količinu"}
                className="text-muted-foreground hover:text-foreground flex h-11 w-11 items-center justify-center transition-colors disabled:opacity-30"
              >
                <Icon name="add" className="text-[14px]" />
              </button>
            </div>
            <div className="min-w-[88px] text-right">
              <div className="text-foreground text-base font-black tracking-tight tabular-nums sm:text-lg">
                {formatPrice(item.price * item.quantity)} RSD
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={dict?.cart?.remove || "Ukloni"}
                className="text-muted-foreground/70 hover:text-destructive mt-1 min-h-11 text-[10px] font-black tracking-widest uppercase transition-colors sm:min-h-0 sm:text-[9px]"
              >
                {dict?.cart?.remove || "Ukloni"}
              </button>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}
