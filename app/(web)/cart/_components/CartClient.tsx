"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import { useCart, MAX_QUANTITY_PER_ITEM } from "@/hooks/use-cart";
import { GlassCard } from "@/components/ui/GlassCard";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { IdentitySetupDialog } from "@/components/shared/IdentitySetupDialog";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CartClient({ dict }: {  dict: Record<string, any> }) {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart, clearStaleCart } = useCart();
  const [isMounted, setIsMounted] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [showIdentityDialog, setShowIdentityDialog] = React.useState(false);

  React.useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsMounted(true);
      clearStaleCart();
    });
    return () => cancelAnimationFrame(timer);
  }, [clearStaleCart]);

  if (!isMounted) return null;

  const total = getTotalPrice();
  const requiresIdentity = items.some(i => i.requiresIdentity);
  const requiresPhoto = items.some(i => i.requiresPhoto);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sr-RS').format(price);
  };

  const handleStartCheckout = () => {
    if (requiresIdentity || requiresPhoto) {
      setShowIdentityDialog(true);
    } else {
      processCheckout({});
    }
  };

  const processCheckout = async ({ holderName, holderPhotoUrl }: { holderName?: string; holderPhotoUrl?: string }) => {
    try {
      setIsCheckingOut(true);
      setShowIdentityDialog(false);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: items.map(i => ({
            ticketTierId: i.ticketId,
            quantity: i.quantity
          })),
          holderName,
          holderPhotoUrl
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize checkout");
      }

      if (data.url) {
        // 🌊 Clear cart immediately so it's empty when they return
        clearCart();
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(message);
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-32 px-6">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="p-8 rounded-full bg-white/5 border border-white/5 relative">
             <div className="absolute inset-0 bg-cyan-500 rounded-full blur-3xl opacity-10 animate-pulse" />
             <Icon name="shopping_bag" className="w-16 h-16 text-cyan-400 relative z-10" />
          </div>
          <div className="space-y-4">
             <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-white">Vaša korpa je prazna</h1>
             <p className="text-slate-400 font-bold">Izgleda da još uvek niste dodali nijednu Splash ponudu.</p>
          </div>
          <Link href={`/akva-parkovi`}>
            <LiquidButton className="h-16 px-12 font-black uppercase tracking-widest text-xs">
              {dict.facilities.discovery_engine || "Pretraga Objekata"}
            </LiquidButton>
          </Link>
          
          <p className="text-[10px] text-slate-600 font-bold max-w-xs leading-relaxed mt-12">
            ℹ️ Korpa Gosta: Vaši izbori se čuvaju lokalno u ovom pretraživaču. Brisanje podataka pretraživača će resetovati vašu korpu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-24 px-6">
      <div className="flex flex-col lg:flex-row gap-12">
        
        {/* 🛒 ITEM LIST */}
        <div className="flex-grow space-y-8">
           <div className="flex items-center justify-between">
              <Link href={`/akva-parkovi`} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group">
                 <Icon name="arrow_back" className="text-[16px] group-hover:-translate-x-1 transition-transform" />
                 <span className="text-[10px] uppercase font-black tracking-widest">Nazad na karte</span>
              </Link>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Korpa za kupovinu</h2>
           </div>

           <div className="space-y-4">
               {items.map((item) => (
                 <div
                   key={item.id}
                 >
                   <GlassCard className="p-6 border-white/5 bg-gradient-to-r from-white/5 to-transparent hover:border-white/10 transition-all group">
                     <div className="flex flex-col md:flex-row items-center gap-8">
                       {/* Icon/Image Placeholder */}
                       <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform relative overflow-hidden">
                          {item.imageUrl ? (
                            <Image 
                              src={item.imageUrl} 
                              alt={item.title} 
                              fill 
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <Icon name="confirmation_number" className="text-[40px] text-cyan-400" />
                          )}
                       </div>

                       {/* Info */}
                       <div className="flex-grow space-y-2 text-center md:text-left">
                          <div className="flex flex-wrap justify-center md:justify-start gap-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400/60">{item.facilityName || "Splash Deal"}</span>
                             {item.validityType === 'SUMMER_SEASON' && (
                               <span className="text-[8px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Sezonska karta</span>
                             )}
                          </div>
                          <h3 className="text-xl font-black text-white italic tracking-tight">{item.title}</h3>
                          <div className="text-sm font-bold text-slate-500">{formatPrice(item.price)} {item.currency} / po stavci</div>
                       </div>

                       {/* Quantity Controls */}
                       <div className="flex items-center gap-6 bg-white/5 p-2 rounded-2xl border border-white/5">
                          <button 
                            disabled={isCheckingOut || item.quantity <= 1}
                            onClick={() => {
                              if (typeof navigator !== 'undefined' && "vibrate" in navigator) navigator.vibrate(10);
                              updateQuantity(item.id, item.quantity - 1);
                            }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-slate-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                             <Icon name="remove" className="text-[16px]" />
                          </button>
                          <span className="font-black text-xl text-white w-6 text-center">{item.quantity}</span>
                          <button 
                            disabled={isCheckingOut || item.quantity >= MAX_QUANTITY_PER_ITEM}
                            onClick={() => {
                              if (typeof navigator !== 'undefined' && "vibrate" in navigator) navigator.vibrate(10);
                              updateQuantity(item.id, item.quantity + 1);
                            }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-slate-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                             <Icon name="add" className="text-[16px]" />
                          </button>
                       </div>

                       {/* Price & Remove */}
                       <div className="flex flex-col items-end gap-2 pr-4 min-w-[120px]">
                          <div className="text-2xl font-black text-white">{formatPrice(item.price * item.quantity)} <span className="text-xs opacity-40 ml-1">{item.currency}</span></div>
                          <button 
                            disabled={isCheckingOut}
                            onClick={() => {
                              if (typeof navigator !== 'undefined' && "vibrate" in navigator) navigator.vibrate([20, 50, 20]);
                              removeItem(item.id);
                            }}
                            className="text-[10px] font-bold text-red-500/60 hover:text-red-500 uppercase tracking-widest flex items-center gap-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                             <Icon name="delete" className="text-[14px]" />
                             Ukloni
                          </button>
                       </div>
                     </div>
                   </GlassCard>
                 </div>
               ))}
           </div>
        </div>

        {/* 💳 SUMMARY SIDEBAR */}
        <div className="w-full lg:w-[400px] space-y-6">
           <GlassCard className="p-8 border-white/5 bg-navy-deep/50 space-y-8 sticky top-24">
              <div className="space-y-4">
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Pregled porudžbine</h2>
                 <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex justify-between text-sm">
                       <span className="text-slate-500 font-bold">Međuzbir</span>
                       <span className="text-white font-black">{formatPrice(total)} RSD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-slate-500 font-bold">Naknada za obradu</span>
                       <span className="text-emerald-400 font-black">0 %</span>
                    </div>
                    <div className="flex justify-between text-2xl pt-4 border-t border-white/5">
                       <span className="font-black italic uppercase tracking-tighter text-white">Ukupno</span>
                       <span className="font-black text-splash">{formatPrice(total)} RSD</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <LiquidButton 
                   onClick={handleStartCheckout}
                   isLoading={isCheckingOut}
                   className="w-full h-20 text-lg font-black uppercase italic tracking-widest shadow-[0_0_40px_rgba(var(--color-primary-rgb),0.2)]"
                 >
                    <span className="flex items-center justify-center gap-3">
                       Nastavi na Plaćanje
                       <Icon name="keyboard_arrow_right" className="text-[20px]" />
                    </span>
                 </LiquidButton>

                 <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                       <Icon name="security" className="text-[16px] text-emerald-400" />
                       Šifrovana i Bezbedna Transakcija
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                       <Icon name="bolt" className="text-[16px] text-amber-400" />
                       Instant Isporuka Karata
                    </div>
                 </div>
              </div>

              <div className="flex items-center justify-center gap-4 pt-6 opacity-30 invert grayscale">
                 <Image src="https://cdn.brandfolder.io/5H075830/at/pwhv6m-48v9oo-6fndw6/Stripe_Logo_rev.png" alt="Stripe" width={80} height={16} className="h-4 w-auto" unoptimized />
                 <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" width={64} height={12} className="h-3 w-auto" unoptimized />
                 <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" width={48} height={24} className="h-6 w-auto" unoptimized />
              </div>
           </GlassCard>

           <p className="text-[10px] text-center text-slate-600 font-bold px-8 leading-relaxed">
             Klikom na &quot;Nastavi na Plaćanje&quot;, prihvatate naše Uslove Korišćenja i Politiku Privatnosti. Sve prodaje digitalnih karata su konačne.
           </p>
        </div>
      </div>

      <IdentitySetupDialog 
        open={showIdentityDialog}
        onOpenChange={setShowIdentityDialog}
        requiresIdentity={requiresIdentity}
        requiresPhoto={requiresPhoto}
        onComplete={processCheckout}
      />
    </div>
  );
}
