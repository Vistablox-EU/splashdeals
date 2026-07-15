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
  const [isMounted, setIsMounted] = React.useState(false);
  const [dict, setDict] = React.useState<Dict | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("sr-RS").format(price);
  };

  React.useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    getClientDictionary().then(setDict);
    return () => cancelAnimationFrame(timer);
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

  if (!isMounted) return null;

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    const result =
      newQuantity <= 0
        ? await removeFromCartAction({ itemId })
        : await updateCartQuantityAction({ itemId, quantity: newQuantity });

    if (!result.success) {
      toast.error(result.error || dict?.cart?.update_error);
      await refresh();
      return;
    }

    await refresh();
    notifyUpdated();
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
              items.map((item) => (
                <div
                  key={item.id}
                  className="border-border bg-muted/20 hover:bg-muted/30 group relative flex gap-4 rounded-[2rem] border p-4 transition-colors"
                >
                  <div className="flex flex-1 flex-col justify-between py-1">
                    <div>
                      <h4 className="text-foreground line-clamp-2 text-sm leading-tight font-black tracking-tight uppercase italic">
                        {item.title}
                      </h4>
                      <p className="text-muted-foreground mt-1 text-[10px] font-bold tracking-widest uppercase">
                        {item.facilityName}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="border-border bg-muted/40 flex items-center overflow-hidden rounded-xl border">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= (item.minPeople || 1)}
                          aria-label={dict?.cart?.decrease_qty}
                          className="text-muted-foreground hover:text-foreground h-11 w-11 rounded-none"
                        >
                          <Icon name="remove" className="text-[14px]" />
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
                            item.quantity >=
                            Math.min(item.maxPeople ?? MAX_QUANTITY_PER_ITEM, MAX_QUANTITY_PER_ITEM)
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
                  </div>
                </div>
              ))
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
