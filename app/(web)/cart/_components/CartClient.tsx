"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import { useCart, MAX_QUANTITY_PER_ITEM } from "@/hooks/use-cart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IdentitySetupDialog } from "@/components/shared/IdentitySetupDialog";
import { createCheckoutSessionAction } from "@/app/(server)/actions/checkout";
import { trackBeginCheckout } from "@/lib/analytics/events";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CartClient({ dict }: { dict: Record<string, any> }) {
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const getTotalPrice = useCart((s) => s.getTotalPrice);
  const clearCart = useCart((s) => s.clearCart);
  const clearStaleCart = useCart((s) => s.clearStaleCart);
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
  const requiresIdentity = items.some((i) => i.requiresIdentity);
  const requiresPhoto = items.some((i) => i.requiresPhoto);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("sr-RS").format(price);
  };

  const handleStartCheckout = () => {
    trackBeginCheckout({
      items: items.map((i) => ({
        ticketId: i.ticketId,
        facilityName: i.facilityName || "",
        ticketTitle: i.title,
        price: i.price,
        quantity: i.quantity,
      })),
    });

    if (requiresIdentity || requiresPhoto) {
      setShowIdentityDialog(true);
    } else {
      processCheckout({});
    }
  };

  const processCheckout = async ({
    holderName,
    holderPhotoUrl,
  }: {
    holderName?: string;
    holderPhotoUrl?: string;
  }) => {
    try {
      setIsCheckingOut(true);
      setShowIdentityDialog(false);

      const result = await createCheckoutSessionAction({
        items: items.map((i) => ({
          ticketPriceId: i.ticketId,
          quantity: i.quantity,
        })),
        holderName,
        holderPhotoUrl,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to initialize checkout");
      }

      if (result.data?.url) {
        // 🌊 Clear cart immediately so it's empty when they return
        clearCart();
        window.location.href = result.data.url;
      } else {
        throw new Error(result.error || "Checkout endpoint returned no redirect URL");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(message);
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-6 py-16 sm:py-32">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="bg-muted/50 border-border relative rounded-full border p-8">
            <div className="bg-primary absolute inset-0 animate-pulse rounded-full opacity-10 blur-3xl" />
            <Icon name="shopping_bag" className="text-primary relative z-10 h-16 w-16" />
          </div>
          <div className="space-y-4">
            <h1 className="text-foreground text-4xl font-black tracking-tighter uppercase italic md:text-5xl">
              Vaša korpa je prazna
            </h1>
            <p className="text-muted-foreground font-bold">
              Izgleda da još uvek niste dodali nijednu Splash ponudu.
            </p>
          </div>
          <Link href={`/akva-parkovi`}>
            <Button className="bg-primary hover:bg-primary/90 h-16 rounded-full px-12 text-xs font-black tracking-widest text-black uppercase">
              {dict.facilities.discovery_engine || "Pretraga Objekata"}
            </Button>
          </Link>

          <p className="text-muted-foreground mt-12 max-w-xs text-[10px] leading-relaxed font-bold">
            ℹ️ Korpa Gosta: Vaši izbori se čuvaju lokalno u ovom pretraživaču. Brisanje podataka
            pretraživača će resetovati vašu korpu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-6 py-12 sm:py-24">
      <div className="flex flex-col gap-6 sm:gap-12 lg:flex-row">
        {/* 🛒 ITEM LIST */}
        <div className="flex-grow space-y-8">
          <div className="flex items-center justify-between">
            <Link
              href={`/akva-parkovi`}
              className="text-muted-foreground hover:text-foreground group flex items-center gap-2 transition-colors"
            >
              <Icon
                name="arrow_back"
                className="text-[16px] transition-transform group-hover:-translate-x-1"
              />
              <span className="text-[10px] font-black tracking-widest uppercase">
                Nazad na karte
              </span>
            </Link>
            <h2 className="text-foreground text-3xl font-black tracking-tighter uppercase italic">
              Korpa za kupovinu
            </h2>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id}>
                <Card className="border-border hover:border-border group from-background/5 bg-gradient-to-r to-transparent p-4 transition-all sm:p-6">
                  <div className="flex flex-col items-center gap-4 sm:gap-8 md:flex-row">
                    {/* Icon/Image Placeholder */}
                    <div className="bg-primary/10 border-primary/20 relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border transition-transform group-hover:scale-110">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <Icon name="confirmation_number" className="text-primary text-[40px]" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-grow space-y-2 text-center md:text-left">
                      <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                        <span className="text-primary/60 text-[10px] font-black tracking-widest uppercase">
                          {item.facilityName || "Splash Deal"}
                        </span>
                        {item.validityType === "SUMMER_SEASON" && (
                          <span className="bg-secondary/20 text-secondary rounded-full px-2 py-0.5 text-[8px] font-black tracking-tighter uppercase">
                            Sezonska karta
                          </span>
                        )}
                      </div>
                      <h3 className="text-foreground text-xl font-black tracking-tight italic">
                        {item.title}
                      </h3>
                      <div className="text-muted-foreground text-sm font-bold">
                        {formatPrice(item.price)} {item.currency} / po stavci
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="bg-muted/50 border-border flex items-center gap-6 rounded-2xl border p-2">
                      <Button
                        disabled={isCheckingOut || item.quantity <= (item.minPeople || 1)}
                        onClick={() => {
                          if (typeof navigator !== "undefined" && "vibrate" in navigator)
                            navigator.vibrate(10);
                          updateQuantity(item.id, item.quantity - 1);
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl"
                        aria-label="Smanji količinu"
                      >
                        <Icon name="remove" className="text-[16px]" />
                      </Button>
                      <span className="text-foreground w-6 text-center text-xl font-black">
                        {item.quantity}
                      </span>
                      <Button
                        disabled={
                          isCheckingOut ||
                          item.quantity >=
                            Math.min(item.maxPeople ?? MAX_QUANTITY_PER_ITEM, MAX_QUANTITY_PER_ITEM)
                        }
                        onClick={() => {
                          if (typeof navigator !== "undefined" && "vibrate" in navigator)
                            navigator.vibrate(10);
                          updateQuantity(item.id, item.quantity + 1);
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl"
                        aria-label="Povećaj količinu"
                      >
                        <Icon name="add" className="text-[16px]" />
                      </Button>
                    </div>

                    {/* Price & Remove */}
                    <div className="flex min-w-[120px] flex-col items-end gap-2 pr-4">
                      <div className="text-foreground text-2xl font-black">
                        {formatPrice(item.price * item.quantity)}{" "}
                        <span className="ml-1 text-xs opacity-40">{item.currency}</span>
                      </div>
                      <Button
                        disabled={isCheckingOut}
                        onClick={() => {
                          if (typeof navigator !== "undefined" && "vibrate" in navigator)
                            navigator.vibrate([20, 50, 20]);
                          removeItem(item.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-destructive/60 hover:text-destructive flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase"
                        aria-label="Ukloni stavku"
                      >
                        <Icon name="delete" className="text-[14px]" />
                        Ukloni
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* 💳 SUMMARY SIDEBAR */}
        <div className="w-full space-y-6 lg:w-[400px]">
          <Card className="border-border bg-navy-deep/50 sticky top-24 space-y-6 p-4 sm:space-y-8 sm:p-8">
            <div className="space-y-4">
              <h2 className="text-foreground text-2xl font-black tracking-tighter uppercase italic">
                Pregled porudžbine
              </h2>
              <div className="border-border space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-bold">Međuzbir</span>
                  <span className="text-foreground font-black">{formatPrice(total)} RSD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-bold">Naknada za obradu</span>
                  <span className="text-primary font-black">0 %</span>
                </div>
                <div className="border-border flex justify-between border-t pt-4 text-2xl">
                  <span className="text-foreground font-black tracking-tighter uppercase italic">
                    Ukupno
                  </span>
                  <span className="text-splash font-black">{formatPrice(total)} RSD</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleStartCheckout}
                disabled={isCheckingOut}
                className="bg-primary hover:bg-primary/90 shadow-primary/20 h-20 w-full rounded-full text-lg font-black tracking-widest text-black uppercase italic shadow-lg"
              >
                <span className="flex items-center justify-center gap-3">
                  {isCheckingOut && (
                    <svg className="size-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
                  {!isCheckingOut && <Icon name="keyboard_arrow_right" className="text-[20px]" />}
                  Nastavi na Plaćanje
                </span>
              </Button>

              <div className="flex flex-col gap-3">
                <div className="text-muted-foreground flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
                  <Icon name="security" className="text-primary text-[16px]" />
                  Šifrovana i Bezbedna Transakcija
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
                  <Icon name="bolt" className="text-secondary text-[16px]" />
                  Instant Isporuka Karata
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-6 opacity-30 grayscale invert">
              <Image
                src="https://cdn.brandfolder.io/5H075830/at/pwhv6m-48v9oo-6fndw6/Stripe_Logo_rev.png"
                alt="Stripe"
                width={80}
                height={16}
                className="h-4 w-auto"
                unoptimized
              />
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png"
                alt="Visa"
                width={64}
                height={12}
                className="h-3 w-auto"
                unoptimized
              />
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png"
                alt="Mastercard"
                width={48}
                height={24}
                className="h-6 w-auto"
                unoptimized
              />
            </div>
          </Card>

          <p className="text-muted-foreground px-8 text-center text-[10px] leading-relaxed font-bold">
            Klikom na &quot;Nastavi na Plaćanje&quot;, prihvatate naše Uslove Korišćenja i Politiku
            Privatnosti. Sve prodaje digitalnih karata su konačne.
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
