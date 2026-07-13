"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import { Drawer } from "vaul";
import { useUIState } from "@/hooks/use-ui-state";
import { useCart, MAX_QUANTITY_PER_ITEM } from "@/hooks/use-cart";
import { LiquidButton } from "@/components/ui/LiquidButton";
import Link from "next/link";
import { getClientDictionary } from "@/lib/client-dictionaries";
import type { Dict } from "@/lib/types";
import { removeFromCartAction, updateCartQuantityAction } from "@/app/(server)/actions/cart";

export const CartDrawer = () => {
  const isCartOpen = useUIState((s) => s.isCartOpen);
  const closeCart = useUIState((s) => s.closeCart);
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const getTotalPrice = useCart((s) => s.getTotalPrice);
  const totalPrice = getTotalPrice();
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

  if (!isMounted) return null;

  return (
    <Drawer.Root open={isCartOpen} onOpenChange={(open) => !open && closeCart()} direction="right">
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm" />
        <Drawer.Content className="bg-navy-deep fixed right-0 bottom-0 z-[2001] flex h-full w-full max-w-md flex-col rounded-l-[3rem] border-l border-white/5 shadow-2xl outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 p-8">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-cyan-400/10 p-3">
                <Icon name="shopping_bag" className="text-[24px] text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl leading-none font-black tracking-tighter text-white uppercase italic">
                  Vaša <span className="text-splash">Korpa</span>
                </h2>
                <p className="mt-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                  {items.length} stavki izabrano
                </p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="rounded-full bg-white/5 p-3 transition-colors hover:bg-white/10"
            >
              <Icon name="close" className="text-[20px] text-white/50" />
            </button>
          </div>

          {/* Items List */}
          <div className="scrollbar-hide flex-1 space-y-6 overflow-y-auto p-8">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                  <Icon name="shopping_bag" className="text-[32px] text-white/20" />
                </div>
                <div className="space-y-1">
                  <p className="font-black text-white uppercase italic">Korpa je prazna</p>
                  <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                    Započnite putovanje
                  </p>
                </div>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="group glass-frost relative rounded-[2rem] border border-white/5 p-5 transition-all hover:border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[10px] font-black tracking-widest text-cyan-500/80 uppercase">
                        {item.category === "Waterpark"
                          ? "Akva Park"
                          : item.category === "Pool"
                            ? "Bazen"
                            : item.category === "Spa"
                              ? "Spa Centar"
                              : item.category || "Akva Park"}
                      </p>
                      <h3 className="mb-1 truncate text-sm leading-none font-black text-white uppercase italic">
                        {item.title}
                      </h3>
                      <p className="truncate text-[10px] font-bold tracking-tighter text-slate-500 uppercase opacity-60">
                        {item.facilityName}
                      </p>

                      <div className="mt-4 flex items-center gap-4">
                        <div className="bg-navy-deep/50 flex items-center rounded-full border border-white/5 p-1">
                          <button
                            disabled={item.quantity <= (item.minPeople || 1)}
                            onClick={() => {
                              if (typeof navigator !== "undefined" && "vibrate" in navigator)
                                navigator.vibrate(10);
                              updateQuantity(item.id, item.quantity - 1);
                              if (process.env.NEXT_PUBLIC_CART_V2) {
                                updateCartQuantityAction({
                                  itemId: item.id,
                                  quantity: item.quantity - 1,
                                }).catch(console.error);
                              }
                            }}
                            className="p-1.5 text-white/40 transition-colors hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Icon name="remove" className="text-[12px]" />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-white">
                            {item.quantity}
                          </span>
                          <button
                            disabled={
                              item.quantity >=
                              Math.min(
                                item.maxPeople ?? MAX_QUANTITY_PER_ITEM,
                                MAX_QUANTITY_PER_ITEM,
                              )
                            }
                            onClick={() => {
                              if (typeof navigator !== "undefined" && "vibrate" in navigator)
                                navigator.vibrate(10);
                              updateQuantity(item.id, item.quantity + 1);
                              if (process.env.NEXT_PUBLIC_CART_V2) {
                                updateCartQuantityAction({
                                  itemId: item.id,
                                  quantity: item.quantity + 1,
                                }).catch(console.error);
                              }
                            }}
                            className="p-1.5 text-white/40 transition-colors hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Icon name="add" className="text-[12px]" />
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            if (typeof navigator !== "undefined" && "vibrate" in navigator)
                              navigator.vibrate([20, 50, 20]);
                            removeItem(item.id);
                            if (process.env.NEXT_PUBLIC_CART_V2) {
                              removeFromCartAction({ itemId: item.id }).catch(console.error);
                            }
                          }}
                          className="text-[10px] font-black tracking-widest text-red-400/50 uppercase transition-colors hover:text-red-400"
                        >
                          {dict?.cart?.remove ?? "Ukloni"}
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black tracking-tighter text-white italic">
                        {formatPrice(item.price * item.quantity)}
                        <span className="ml-1 text-[10px] uppercase not-italic opacity-50">
                          RSD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {items.length > 0 && (
            <div className="bg-navy-deep/80 space-y-6 border-t border-white/5 p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase">
                  Ukupno za uplatu
                </span>
                <div className="text-3xl font-black tracking-tighter text-white italic">
                  {formatPrice(totalPrice)}
                  <span className="ml-1 text-xs uppercase not-italic opacity-50">RSD</span>
                </div>
              </div>

              <Link href="/cart" onClick={closeCart}>
                <LiquidButton className="group h-16 w-full text-lg">
                  Nastavi na Plaćanje
                  <Icon
                    name="arrow_forward"
                    className="ml-2 text-[20px] transition-transform group-hover:translate-x-1"
                  />
                </LiquidButton>
              </Link>

              <div className="text-center">
                <p className="text-[8px] font-black tracking-[0.3em] text-slate-600 uppercase">
                  Bezbedna transakcija šifrovana sa 256-bitnom enkripcijom
                </p>
              </div>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
