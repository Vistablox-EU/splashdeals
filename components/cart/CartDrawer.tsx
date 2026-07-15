"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import { Drawer } from "vaul";
import { useUIState } from "@/hooks/use-ui-state";
import { useServerCart } from "@/hooks/use-server-cart";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/types/cart";
import { LiquidButton } from "@/components/ui/LiquidButton";
import Link from "next/link";
import { getClientDictionary } from "@/lib/client-dictionaries";
import type { Dict } from "@/lib/types";
import { removeFromCartAction, updateCartQuantityAction } from "@/app/(server)/actions/cart";
import { toast } from "sonner";

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
      toast.error(result.error || "Izmena korpe nije uspela.");
      await refresh();
      return;
    }

    await refresh();
    notifyUpdated();
  };

  return (
    <Drawer.Root open={isCartOpen} onOpenChange={(open) => !open && closeCart()} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm" />
        <Drawer.Content className="bg-navy-deep fixed right-0 bottom-0 z-[2001] flex h-full w-full max-w-md flex-col rounded-l-[3rem] border-l border-white/5 shadow-2xl outline-none">
          <div className="flex items-center justify-between border-b border-white/5 p-8">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-cyan-400/10 p-3">
                <Icon name="shopping_bag" className="text-[24px] text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl leading-none font-black tracking-tighter text-white uppercase italic">
                  {(dict?.cart?.title || "Vaša Korpa")
                    .split(" ")
                    .map((word: string, i: number, arr: string[]) =>
                      i === arr.length - 1 ? (
                        <span key={i} className="text-splash">
                          {word}
                        </span>
                      ) : (
                        <React.Fragment key={i}>{word} </React.Fragment>
                      ),
                    )}
                </h2>
                <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                  {items.length} {dict?.cart?.items || "stavki"}
                </p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="rounded-2xl bg-white/5 p-3 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-8">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-4 text-center opacity-40">
                <Icon name="shopping_cart" className="text-[48px]" />
                <p className="text-sm font-bold tracking-widest uppercase">
                  {dict?.cart?.empty || "Korpa je prazna"}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex gap-4 rounded-[2rem] border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/[0.07]"
                >
                  <div className="flex flex-1 flex-col justify-between py-1">
                    <div>
                      <h4 className="line-clamp-2 text-sm leading-tight font-black tracking-tight text-white uppercase italic">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                        {item.facilityName}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 rounded-xl bg-black/40 p-1">
                        <button
                          disabled={item.quantity <= (item.minPeople || 1)}
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white transition-all hover:bg-white/10 disabled:opacity-30"
                        >
                          <Icon name="remove" className="text-[16px]" />
                        </button>
                        <span className="w-4 text-center text-xs font-black text-white">
                          {item.quantity}
                        </span>
                        <button
                          disabled={
                            item.quantity >=
                            Math.min(item.maxPeople ?? MAX_QUANTITY_PER_ITEM, MAX_QUANTITY_PER_ITEM)
                          }
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white transition-all hover:bg-white/10 disabled:opacity-30"
                        >
                          <Icon name="add" className="text-[16px]" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-cyan-400">
                          {formatPrice(item.price * item.quantity)} RSD
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-6 border-t border-white/5 bg-black/20 p-8">
              <div className="flex items-end justify-between">
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                  {dict?.cart?.total || "Ukupno"}
                </span>
                <span className="text-3xl font-black tracking-tighter text-white italic">
                  {formatPrice(totalPrice)}{" "}
                  <span className="text-splash text-sm not-italic">RSD</span>
                </span>
              </div>
              <Link href="/cart" onClick={closeCart}>
                <LiquidButton className="h-16 w-full text-sm font-black tracking-widest uppercase">
                  {dict?.cart?.checkout || "Nastavi na plaćanje"}
                </LiquidButton>
              </Link>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
