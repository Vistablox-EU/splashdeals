"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import { Drawer } from "vaul";
import { useUIState } from "@/hooks/use-ui-state";
import { useServerCart } from "@/hooks/use-server-cart";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/types/cart";
import Link from "next/link";
import { getClientDictionary } from "@/lib/client-dictionaries";
import type { Dict } from "@/lib/types";
import { removeFromCartAction, updateCartQuantityAction } from "@/app/(server)/actions/cart";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const CartDrawer = () => {
  const isCartOpen = useUIState((s) => s.isCartOpen);
  const closeCart = useUIState((s) => s.closeCart);
  const items = useServerCart((s) => s.items);
  const totalPrice = useServerCart((s) => s.totalPrice);
  const refresh = useServerCart((s) => s.refresh);
  const notifyUpdated = useServerCart((s) => s.notifyUpdated);
  const setItems = useServerCart((s) => s.setItems);
  const [isMounted, setIsMounted] = React.useState(false);
  const [dict, setDict] = React.useState<Dict | null>(null);
  const [mutatingItemId, setMutatingItemId] = React.useState<string | null>(null);
  const [isDesktop, setIsDesktop] = React.useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("sr-RS").format(price);
  };

  React.useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    getClientDictionary().then(setDict);
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => {
      cancelAnimationFrame(timer);
      mq.removeEventListener("change", apply);
    };
  }, []);

  React.useEffect(() => {
    if (!isCartOpen) return;
    // Mobile single-cart IA: never keep the drawer open below md.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      closeCart();
      return;
    }
    void refresh();
  }, [isCartOpen, refresh, closeCart]);

  // Never mount drawer portal on mobile — avoids stuck overlays intercepting taps on /cart
  if (!isMounted || !isDesktop) return null;

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (!itemId) return;
    setMutatingItemId(itemId);
    const previousItems = useServerCart.getState().items;
    const item = previousItems.find((i) => i.id === itemId);
    if (!item) {
      setMutatingItemId(null);
      return;
    }
    const minQty = Math.max(1, item.minPeople || 1);
    const shouldRemove = newQuantity < minQty || newQuantity <= 0;

    if (shouldRemove) {
      setItems(previousItems.filter((i) => i.id !== itemId));
    } else {
      setItems(previousItems.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i)));
    }

    try {
      const result = shouldRemove
        ? await removeFromCartAction({ itemId })
        : await updateCartQuantityAction({ itemId, quantity: newQuantity });

      if (!result.success) {
        setItems(previousItems);
        toast.error(result.error || dict?.cart?.update_error || dict?.cart?.remove_error);
        await refresh();
        return;
      }

      if (
        shouldRemove &&
        result.data &&
        "items" in result.data &&
        Array.isArray(result.data.items)
      ) {
        const serverItems = result.data.items;
        const expectedRemaining = previousItems.filter((i) => i.id !== itemId);
        if (serverItems.length === 0 && expectedRemaining.length > 0) {
          await refresh();
        } else {
          setItems(serverItems);
        }
      } else if (!shouldRemove && result.data && "item" in result.data && result.data.item) {
        const updated = result.data.item;
        setItems(useServerCart.getState().items.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        await refresh();
      }
      notifyUpdated();
    } catch {
      setItems(previousItems);
      toast.error(dict?.cart?.update_error || dict?.cart?.remove_error);
    } finally {
      setMutatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!itemId) return;
    setMutatingItemId(itemId);
    const previousItems = useServerCart.getState().items;
    const item = previousItems.find((i) => i.id === itemId);
    if (!item) {
      setMutatingItemId(null);
      return;
    }

    // Unit-aware: decrease one when qty above min; only delete the line at min.
    const minQty = Math.max(1, item.minPeople || 1);
    if (item.quantity > minQty) {
      await handleUpdateQuantity(itemId, item.quantity - 1);
      return;
    }

    const optimistic = previousItems.filter((i) => i.id !== itemId);
    setItems(optimistic);
    try {
      const result = await removeFromCartAction({ itemId });
      if (!result.success) {
        setItems(previousItems);
        toast.error(result.error || dict?.cart?.remove_error || dict?.cart?.update_error);
        await refresh();
        return;
      }
      if (Array.isArray(result.data?.items)) {
        const serverItems = result.data.items;
        if (serverItems.length === 0 && optimistic.length > 0) {
          await refresh();
        } else {
          setItems(serverItems);
        }
      }
      notifyUpdated();
    } catch {
      setItems(previousItems);
      toast.error(dict?.cart?.remove_error || dict?.cart?.update_error);
    } finally {
      setMutatingItemId(null);
    }
  };

  return (
    <Drawer.Root open={isCartOpen} onOpenChange={(open) => !open && closeCart()} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="bg-background/60 fixed inset-0 z-[2000] backdrop-blur-sm" />
        <Drawer.Content className="bg-card border-border text-foreground fixed right-0 bottom-0 z-[2001] flex h-full w-full max-w-md flex-col rounded-l-[3rem] border-l shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]">
          <div className="border-border flex items-center justify-between border-b p-8">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 rounded-2xl p-3">
                <Icon name="shopping_bag" className="text-primary text-[24px]" />
              </div>
              <div>
                <h2 className="text-foreground text-xl leading-none font-black tracking-tighter uppercase italic">
                  {(dict?.cart?.title || "")
                    .split(" ")
                    .map((word: string, i: number, arr: string[]) =>
                      i === arr.length - 1 ? (
                        <span key={i} className="text-primary">
                          {word}
                        </span>
                      ) : (
                        <React.Fragment key={i}>{word} </React.Fragment>
                      ),
                    )}
                </h2>
                <p className="text-muted-foreground mt-1 text-[10px] font-bold tracking-widest uppercase">
                  {items.length} {dict?.cart?.items}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeCart}
              aria-label={dict?.cart?.close}
              className="bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring h-11 w-11 rounded-2xl focus-visible:ring-2"
            >
              <Icon name="close" className="text-[20px]" />
            </Button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-4 text-center opacity-60">
                <Icon name="shopping_cart" className="text-[48px]" />
                <p className="text-sm font-bold tracking-widest uppercase">{dict?.cart?.empty}</p>
              </div>
            ) : (
              items.map((item) => {
                const minQty = Math.max(1, item.minPeople || 1);
                const isMutating = mutatingItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className="border-border bg-muted/20 hover:bg-muted/30 group relative flex gap-4 rounded-[2rem] border p-4 transition-colors"
                  >
                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-foreground line-clamp-2 text-sm leading-tight font-black tracking-tight uppercase italic">
                            {item.title}
                          </h4>
                          <p className="text-muted-foreground mt-1 text-[10px] font-bold tracking-widest uppercase">
                            {item.facilityName}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isMutating}
                          aria-label={dict?.cart?.remove || "Ukloni"}
                          className="text-muted-foreground hover:text-destructive h-11 w-11 shrink-0 rounded-xl"
                        >
                          <Icon name="delete" className="text-[18px]" />
                        </Button>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="border-border bg-muted/40 flex items-center overflow-hidden rounded-xl border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={isMutating}
                            aria-label={
                              item.quantity <= minQty
                                ? dict?.cart?.remove || "Ukloni"
                                : dict?.cart?.decrease_qty
                            }
                            className="text-muted-foreground hover:text-foreground h-11 w-11 rounded-none"
                          >
                            <Icon
                              name={item.quantity <= minQty ? "delete" : "remove"}
                              className="text-[14px]"
                            />
                          </Button>
                          <span className="text-foreground w-8 text-center text-xs font-black tabular-nums">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={
                              isMutating ||
                              item.quantity >=
                                Math.min(
                                  item.maxPeople ?? MAX_QUANTITY_PER_ITEM,
                                  MAX_QUANTITY_PER_ITEM,
                                )
                            }
                            aria-label={dict?.cart?.increase_qty}
                            className="text-muted-foreground hover:text-foreground h-11 w-11 rounded-none"
                          >
                            <Icon name="add" className="text-[14px]" />
                          </Button>
                        </div>
                        <p className="text-primary text-sm font-black tabular-nums">
                          {formatPrice(item.price * item.quantity)} RSD
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isMutating}
                        className="text-muted-foreground/80 hover:text-destructive mt-2 h-9 self-start px-0 text-[10px] font-black tracking-widest uppercase"
                      >
                        {dict?.cart?.remove || "Ukloni"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <div className="border-border bg-muted/20 space-y-6 border-t p-8">
              <div className="flex items-end justify-between">
                <span className="text-muted-foreground text-[10px] font-black tracking-[0.2em] uppercase">
                  {dict?.cart?.total}
                </span>
                <span className="text-foreground text-3xl font-black tracking-tighter italic">
                  {formatPrice(totalPrice)}{" "}
                  <span className="text-primary text-sm not-italic">RSD</span>
                </span>
              </div>
              {/* Drawer is a preview — full checkout lives on /cart */}
              <Button asChild className="h-16 w-full text-sm font-black tracking-widest uppercase">
                <Link href="/cart" onClick={closeCart}>
                  {dict?.cart?.view_cart}
                </Link>
              </Button>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
