"use client";

import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/types/cart";
import type { CartItem, CartDictionary } from "@/lib/types/cart";

interface CartItemListProps {
  items: CartItem[];
  dict: { cart?: CartDictionary } & Record<string, unknown>;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  removedItems?: string[];
  changedItems?: string[];
  mutatingItemId?: string | null;
}

export function CartItemList({
  items,
  dict,
  onQuantityChange,
  onRemove,
  removedItems = [],
  changedItems = [],
  mutatingItemId = null,
}: CartItemListProps) {
  const formatPrice = (price: number) => new Intl.NumberFormat("sr-RS").format(price);
  const cartDict = dict?.cart;

  return (
    <>
      {/* Error state notices */}
      {removedItems.length > 0 && (
        <div className="bg-destructive/10 border-destructive/20 mb-4 rounded-xl border p-3 text-sm sm:p-4">
          <p className="text-destructive font-bold">{cartDict?.removed_notice}</p>
          <ul className="text-destructive/80 mt-2 list-inside list-disc space-y-1">
            {removedItems.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      )}
      {changedItems.length > 0 && (
        <div className="border-warning/20 bg-warning/10 mb-4 rounded-xl border p-3 text-sm sm:p-4">
          <p className="text-warning font-bold">{cartDict?.price_changed_notice}</p>
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
                {item.category || cartDict?.default_category}
              </p>
              <h3 className="text-foreground mt-1 text-base leading-snug font-black tracking-tight sm:text-lg">
                {item.title}
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">{item.facilityName}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="border-border bg-muted/30 flex items-center overflow-hidden rounded-xl border">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const minQty = Math.max(1, item.minPeople || 1);
                  // At min qty, minus removes the line (qty steppers alone were a dead end).
                  if (item.quantity <= minQty) {
                    onRemove(item.id);
                  } else {
                    onQuantityChange(item.id, item.quantity - 1);
                  }
                }}
                disabled={mutatingItemId === item.id}
                aria-label={
                  item.quantity <= Math.max(1, item.minPeople || 1)
                    ? cartDict?.remove
                    : cartDict?.decrease_qty
                }
                className="text-muted-foreground hover:text-foreground h-11 w-11 rounded-none"
              >
                <Icon
                  name={item.quantity <= Math.max(1, item.minPeople || 1) ? "delete" : "remove"}
                  className="text-[14px]"
                />
              </Button>
              <span className="text-foreground min-w-[32px] text-center text-sm font-bold tabular-nums">
                {item.quantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                disabled={
                  mutatingItemId === item.id ||
                  item.quantity >=
                    Math.min(item.maxPeople ?? MAX_QUANTITY_PER_ITEM, MAX_QUANTITY_PER_ITEM)
                }
                aria-label={cartDict?.increase_qty}
                className="text-muted-foreground hover:text-foreground h-11 w-11 rounded-none"
              >
                <Icon name="add" className="text-[14px]" />
              </Button>
            </div>
            <div className="min-w-[88px] text-right">
              <div className="text-foreground text-base font-black tracking-tight tabular-nums sm:text-lg">
                {formatPrice(item.price * item.quantity)} RSD
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id)}
                disabled={mutatingItemId === item.id}
                aria-label={cartDict?.remove}
                className="text-muted-foreground/70 hover:text-destructive mt-1 h-11 px-0 text-[10px] font-black tracking-widest uppercase sm:h-8 sm:text-[9px]"
              >
                {cartDict?.remove}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}
