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

/**
 * Remove one unit when qty is above the line minimum; only delete the whole line
 * when already at min qty. Matches “remove a single item” (not clear cart).
 */
function removeOneUnitOrLine(
  item: CartItem,
  onQuantityChange: (itemId: string, quantity: number) => void,
  onRemove: (itemId: string) => void,
) {
  const minQty = Math.max(1, item.minPeople || 1);
  if (item.quantity > minQty) {
    onQuantityChange(item.id, item.quantity - 1);
    return;
  }
  onRemove(item.id);
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

      {items.map((item) => {
        const minQty = Math.max(1, item.minPeople || 1);
        const isMutating = mutatingItemId === item.id;
        const atMin = item.quantity <= minQty;

        return (
          <Card
            key={item.id}
            className="bg-muted/20 border-border relative flex flex-col gap-3 p-3 sm:gap-4 sm:p-6"
          >
            {/* Header: image + title + trash (unit-aware) */}
            <div className="flex min-w-0 items-start gap-3">
              {item.imageUrl && (
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl sm:h-20 sm:w-20">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 64px, 80px"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1 pr-1">
                <p className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                  {item.category || cartDict?.default_category}
                </p>
                <h3 className="text-foreground mt-0.5 text-base leading-snug font-black tracking-tight sm:text-lg">
                  {item.title}
                </h3>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">{item.facilityName}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeOneUnitOrLine(item, onQuantityChange, onRemove);
                }}
                disabled={isMutating}
                aria-label={cartDict?.remove || "Ukloni"}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-11 min-h-11 w-11 min-w-11 shrink-0 touch-manipulation rounded-xl"
              >
                <Icon name="delete" className="text-[20px]" />
              </Button>
            </div>

            {/* Qty stepper + line total */}
            <div className="flex items-center justify-between gap-3">
              <div className="border-border bg-muted/30 flex items-center overflow-hidden rounded-xl border">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // At min qty, minus fully removes the line.
                    if (atMin) {
                      onRemove(item.id);
                    } else {
                      onQuantityChange(item.id, item.quantity - 1);
                    }
                  }}
                  disabled={isMutating}
                  aria-label={atMin ? cartDict?.remove || "Ukloni" : cartDict?.decrease_qty}
                  className="text-muted-foreground hover:text-foreground h-11 min-h-11 w-11 min-w-11 touch-manipulation rounded-none"
                >
                  <Icon name={atMin ? "delete" : "remove"} className="text-[16px]" />
                </Button>
                <span className="text-foreground min-w-[2.25rem] text-center text-sm font-bold tabular-nums">
                  {item.quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onQuantityChange(item.id, item.quantity + 1);
                  }}
                  disabled={
                    isMutating ||
                    item.quantity >=
                      Math.min(item.maxPeople ?? MAX_QUANTITY_PER_ITEM, MAX_QUANTITY_PER_ITEM)
                  }
                  aria-label={cartDict?.increase_qty}
                  className="text-muted-foreground hover:text-foreground h-11 min-h-11 w-11 min-w-11 touch-manipulation rounded-none"
                >
                  <Icon name="add" className="text-[16px]" />
                </Button>
              </div>

              <div className="text-right">
                <div className="text-foreground text-base font-black tracking-tight tabular-nums sm:text-lg">
                  {formatPrice(item.price * item.quantity)} RSD
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeOneUnitOrLine(item, onQuantityChange, onRemove);
                  }}
                  disabled={isMutating}
                  aria-label={cartDict?.remove || "Ukloni"}
                  className="text-muted-foreground hover:text-destructive mt-0.5 h-10 min-h-10 touch-manipulation px-2 text-[11px] font-black tracking-widest uppercase"
                >
                  {cartDict?.remove || "Ukloni"}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </>
  );
}
