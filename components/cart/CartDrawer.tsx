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
    return new Intl.NumberFormat('sr-RS').format(price);
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
        <Drawer.Content className="bg-navy-deep border-l border-white/5 flex flex-col rounded-l-[3rem] h-full w-full max-w-md fixed bottom-0 right-0 z-[2001] outline-none shadow-2xl">
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-400/10 rounded-2xl">
                <Icon name="shopping_bag" className="text-[24px] text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">
                  Vaša <span className="text-splash">Korpa</span>
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  {items.length} stavki izabrano
                </p>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
            >
              <Icon name="close" className="text-[20px] text-white/50" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                    <Icon name="shopping_bag" className="text-[32px] text-white/20" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-white font-black italic uppercase">Korpa je prazna</p>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Započnite putovanje</p>
                  </div>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="group relative glass-frost p-5 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500/80 mb-1">
                          {item.category === 'Waterpark' ? 'Akva Park' : item.category === 'Pool' ? 'Bazen' : item.category === 'Spa' ? 'Spa Centar' : item.category || 'Akva Park'}
                        </p>
                        <h3 className="text-sm font-black text-white italic truncate leading-none mb-1 uppercase">
                          {item.title}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate opacity-60">
                           {item.facilityName}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center bg-navy-deep/50 rounded-full border border-white/5 p-1">
                             <button 
                                disabled={item.quantity <= (item.minPeople || 1)}
                                onClick={() => {
                                  if (typeof navigator !== 'undefined' && "vibrate" in navigator) navigator.vibrate(10);
                                  updateQuantity(item.id, item.quantity - 1);
                                }}
                                className="p-1.5 hover:text-cyan-400 text-white/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                             >
                               <Icon name="remove" className="text-[12px]" />
                             </button>
                             <span className="w-8 text-center text-xs font-black text-white">{item.quantity}</span>
                             <button 
                                disabled={item.quantity >= Math.min(item.maxPeople ?? MAX_QUANTITY_PER_ITEM, MAX_QUANTITY_PER_ITEM)}
                                onClick={() => {
                                  if (typeof navigator !== 'undefined' && "vibrate" in navigator) navigator.vibrate(10);
                                  updateQuantity(item.id, item.quantity + 1);
                                }}
                                className="p-1.5 hover:text-cyan-400 text-white/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                             >
                                <Icon name="add" className="text-[12px]" />
                             </button>
                           </div>
                            <button 
                              onClick={() => {
                                if (typeof navigator !== 'undefined' && "vibrate" in navigator) navigator.vibrate([20, 50, 20]);
                                removeItem(item.id);
                              }}
                              className="text-[10px] font-black uppercase text-red-400/50 hover:text-red-400 transition-colors tracking-widest"
                            >
                              {dict?.cart?.remove ?? "Ukloni"}
                            </button>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-black text-white tracking-tighter italic">
                          {formatPrice(item.price * item.quantity)}
                          <span className="text-[10px] ml-1 opacity-50 uppercase not-italic">RSD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
          </div>

          {/* Footer Checkout */}
          {items.length > 0 && (
            <div className="p-8 border-t border-white/5 space-y-6 bg-navy-deep/80 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Ukupno za uplatu</span>
                <div className="text-3xl font-black text-white tracking-tighter italic">
                  {formatPrice(totalPrice)}
                  <span className="text-xs ml-1 opacity-50 uppercase not-italic">RSD</span>
                </div>
              </div>
              
              <Link href="/cart" onClick={closeCart}>
                <LiquidButton className="w-full h-16 text-lg group">
                  Nastavi na Plaćanje
                  <Icon name="arrow_forward" className="ml-2 text-[20px] group-hover:translate-x-1 transition-transform" />
                </LiquidButton>
              </Link>
              
              <div className="text-center">
                 <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600">
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
