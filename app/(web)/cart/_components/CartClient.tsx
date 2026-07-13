"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/types/cart";
import type { CartItem, DiscountInfo } from "@/lib/types/cart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IdentitySetupDialog } from "@/components/shared/IdentitySetupDialog";
import { createCheckoutSessionAction } from "@/app/(server)/actions/checkout";
import { validatePromoCodeAction } from "@/app/(server)/actions/campaigns";
import {
  getCartAction,
  removeFromCartAction,
  updateCartQuantityAction,
  clearCartAction,
} from "@/app/(server)/actions/cart";
import { trackBeginCheckout } from "@/lib/analytics/events";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CartClient({ dict }: { dict: Record<string, any> }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [showIdentityDialog, setShowIdentityDialog] = React.useState(false);
  const [promoCode, setPromoCode] = React.useState("");
  const [promoError, setPromoError] = React.useState("");
  const [promoLoading, setPromoLoading] = React.useState(false);
  const [discount, setDiscount] = React.useState<DiscountInfo | null>(null);

  const totalBeforeDiscount = items.reduce(
    (sum: number, i: CartItem) => sum + i.price * i.quantity,
    0,
  );
  const discountAmount = discount
    ? Math.round(totalBeforeDiscount * (discount.discountPercent / 100))
    : 0;
  const total = totalBeforeDiscount - discountAmount;

  // Load cart from server on mount
  React.useEffect(() => {
    const timer = requestAnimationFrame(async () => {
      setIsMounted(true);
      const result = await getCartAction();
      if (result.success && result.data) {
        setItems((result.data.items || []) as CartItem[]);
      }
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  if (!isMounted) return null;

  const requiresIdentity = items.some((i) => i.requiresIdentity);
  const requiresPhoto = items.some((i) => i.requiresPhoto);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("sr-RS").format(price);
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      await removeFromCartAction({ itemId }).catch(console.error);
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, quantity: newQuantity, updatedAt: Date.now() } : i,
        ),
      );
      await updateCartQuantityAction({ itemId, quantity: newQuantity }).catch(console.error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await removeFromCartAction({ itemId }).catch(console.error);
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
        await clearCartAction().catch(console.error);
        setItems([]);
        window.location.href = result.data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(dict?.cart?.checkout_error || "Došlo je do greške. Pokušajte ponovo.");
      console.error("Checkout error:", message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 pt-24 pb-32 sm:px-12">
      <div className="mb-12">
        <h1 className="mb-3 text-[10px] font-black tracking-[0.2em] uppercase opacity-50">
          {dict?.cart?.title || "Korpa"}
        </h1>
        <h2 className="text-foreground text-3xl leading-none font-black tracking-tighter sm:text-5xl">
          {items.length > 0
            ? `${items.length} ${dict?.cart?.items || "stavki"}`
            : dict?.cart?.empty || "Vaša korpa je prazna"}
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20">
          <div className="bg-muted/20 flex h-24 w-24 items-center justify-center rounded-full">
            <Icon name="shopping_bag" className="text-muted-foreground/30 text-[40px]" />
          </div>
          <p className="text-muted-foreground mt-6 text-sm font-medium">
            {dict?.cart?.empty_description || "Izgleda da još uvek niste dodali karte."}
          </p>
          <Link href="/search">
            <Button variant="ghost" className="mt-4">
              {dict?.cart?.browse || "Pretraži akva parkove"}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items */}
          <div className="space-y-6 lg:col-span-2">
            {items.map((item) => (
              <Card key={item.id} className="bg-muted/20 border-border flex items-center gap-6 p-6">
                {item.imageUrl && (
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                    {item.category || dict?.categories?.waterpark || "Akva Park"}
                  </p>
                  <h3 className="text-foreground mt-1 text-lg font-black tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground mt-0.5 text-xs">{item.facilityName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="border-border bg-muted/30 flex items-center overflow-hidden rounded-xl border">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= (item.minPeople || 1)}
                      className="text-muted-foreground hover:text-foreground px-3 py-2 transition-colors disabled:opacity-30"
                    >
                      <Icon name="remove" className="text-[14px]" />
                    </button>
                    <span className="text-foreground min-w-[32px] text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={
                        item.quantity >=
                        Math.min(item.maxPeople ?? MAX_QUANTITY_PER_ITEM, MAX_QUANTITY_PER_ITEM)
                      }
                      className="text-muted-foreground hover:text-foreground px-3 py-2 transition-colors disabled:opacity-30"
                    >
                      <Icon name="add" className="text-[14px]" />
                    </button>
                  </div>
                  <div className="min-w-[80px] text-right">
                    <div className="text-foreground text-lg font-black tracking-tight">
                      {formatPrice(item.price * item.quantity)} RSD
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-muted-foreground/50 hover:text-destructive mt-1 text-[9px] font-black tracking-widest uppercase transition-colors"
                    >
                      {dict?.cart?.remove || "Ukloni"}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <Card className="bg-muted/20 border-border p-8">
              <h3 className="text-foreground mb-6 text-[10px] font-black tracking-[0.2em] uppercase">
                {dict?.cart?.summary || "Sažetak"}
              </h3>

              <div className="space-y-3">
                <div className="text-foreground flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {dict?.cart?.subtotal || "Međuzbir"}
                  </span>
                  <span className="font-bold">{formatPrice(totalBeforeDiscount)} RSD</span>
                </div>

                {discount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-500">
                      {dict?.cart?.discount || "Popust"} ({discount.discountPercent}%)
                    </span>
                    <span className="font-bold text-emerald-500">
                      -{formatPrice(discountAmount)} RSD
                    </span>
                  </div>
                )}

                <div className="border-border border-t pt-3">
                  <div className="flex justify-between text-base">
                    <span className="text-foreground font-bold">
                      {dict?.cart?.total || "Ukupno"}
                    </span>
                    <span className="text-foreground text-xl font-black tracking-tight">
                      {formatPrice(total)} RSD
                    </span>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mt-6 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setPromoError("");
                    }}
                    placeholder={dict?.cart?.promo_placeholder || "Unesite promo kod"}
                    className="bg-muted/50 border-border h-11 rounded-xl text-xs"
                  />
                  <Button
                    disabled={!promoCode || promoLoading}
                    onClick={async () => {
                      setPromoLoading(true);
                      try {
                        const result = await validatePromoCodeAction(promoCode);
                        if (result.success && result.data?.valid) {
                          setDiscount({
                            campaignId: result.data.campaignId,
                            code: promoCode,
                            discountPercent: result.data.discountPercent,
                          });
                          toast.success(dict?.cart?.promo_applied || "Popust primenjen!");
                        } else {
                          const promoData = result.success ? result.data : null;
                          const errorMsg =
                            promoData && !promoData.valid
                              ? promoData.error
                              : dict?.cart?.promo_invalid || "Nevažeći promo kod";
                          setPromoError(errorMsg);
                        }
                      } finally {
                        setPromoLoading(false);
                      }
                    }}
                    className="h-11 rounded-xl px-4 text-xs font-bold"
                  >
                    {dict?.cart?.apply || "Primeni"}
                  </Button>
                </div>
                {promoError && (
                  <p className="text-destructive text-[10px] font-medium">{promoError}</p>
                )}
                {discount && (
                  <button
                    onClick={() => setDiscount(null)}
                    className="text-destructive/70 hover:text-destructive text-[9px] font-black tracking-widest uppercase transition-colors"
                  >
                    {dict?.cart?.remove || "Ukloni"} {discount.code}
                  </button>
                )}
              </div>

              <Button
                onClick={handleStartCheckout}
                disabled={isCheckingOut || items.length === 0}
                className="mt-6 h-14 w-full rounded-2xl text-base font-bold"
              >
                {isCheckingOut
                  ? dict?.cart?.processing || "Obrada..."
                  : dict?.cart?.checkout || "Nastavi na Plaćanje"}
              </Button>
            </Card>

            <Card className="bg-muted/20 border-border flex flex-wrap items-center justify-center gap-4 p-6">
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
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/DinaCard_logo.svg/2560px-DinaCard_logo.svg.png"
                alt="DinaCard"
                width={48}
                height={24}
                className="h-6 w-auto"
                unoptimized
              />
            </Card>

            <p className="text-muted-foreground px-8 text-center text-[10px] leading-relaxed font-bold">
              Klikom na &quot;Nastavi na Plaćanje&quot;, prihvatate naše Uslove Korišćenja i
              Politiku Privatnosti. Sve prodaje digitalnih karata su konačne.
            </p>
          </div>
        </div>
      )}

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
