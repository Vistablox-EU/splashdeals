"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";
import { IdentitySetupDialog } from "@/components/shared/IdentitySetupDialog";
import { createCheckoutSessionAction } from "@/app/(server)/actions/checkout";
import { clearCartAction } from "@/app/(server)/actions/cart";
import { trackBeginCheckout } from "@/lib/analytics/events";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import type { CartItem, DiscountInfo } from "@/lib/types/cart";

interface CheckoutFormProps {
  initialItems: CartItem[];
  totalBeforeDiscount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: Record<string, any>;
}

export function CheckoutForm({ initialItems, totalBeforeDiscount, dict }: CheckoutFormProps) {
  const [items] = React.useState<CartItem[]>(initialItems);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [showIdentityDialog, setShowIdentityDialog] = React.useState(false);
  const [discount, _setDiscount] = React.useState<DiscountInfo | null>(null);

  const discountAmount = discount
    ? Math.round(totalBeforeDiscount * (discount.discountPercent / 100))
    : 0;
  const total = totalBeforeDiscount - discountAmount;

  const requiresIdentity = items.some((i) => i.requiresIdentity);
  const requiresPhoto = items.some((i) => i.requiresPhoto);

  const formatPrice = (price: number) => new Intl.NumberFormat("sr-RS").format(price);

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
        <Link
          href="/cart"
          className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 text-xs font-bold tracking-wider uppercase transition-colors"
        >
          <Icon name="arrow_back" className="text-[14px]" />
          {dict?.checkout?.back_to_cart || "Nazad na korpu"}
        </Link>
        <h1 className="text-foreground mb-3 text-[10px] font-black tracking-[0.2em] uppercase opacity-50">
          {dict?.checkout?.title || "Pregled porudžbine"}
        </h1>
        <h2 className="text-foreground text-3xl font-black tracking-tighter sm:text-5xl">
          {dict?.checkout?.heading || "Potvrdite i platite"}
        </h2>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-6 lg:col-span-2">
          {items.map((item) => (
            <Card key={item.id} className="bg-muted/20 border-border flex items-center gap-6 p-6">
              {item.imageUrl && (
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="80px"
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
              <div className="text-right">
                <div className="text-foreground text-lg font-black">
                  {formatPrice(item.price * item.quantity)} RSD
                </div>
                <p className="text-muted-foreground text-xs">
                  {item.quantity} × {formatPrice(item.price)} RSD
                </p>
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{dict?.cart?.subtotal || "Međuzbir"}</span>
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
                  <span className="text-foreground font-bold">{dict?.cart?.total || "Ukupno"}</span>
                  <span className="text-foreground text-xl font-black tracking-tight">
                    {formatPrice(total)} RSD
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleStartCheckout}
              disabled={isCheckingOut}
              className="mt-6 h-14 w-full rounded-2xl text-base font-bold"
            >
              {isCheckingOut
                ? dict?.cart?.processing || "Obrada..."
                : dict?.checkout?.confirm || "Potvrdi i Plati"}
            </Button>
          </Card>

          <p className="text-muted-foreground px-4 text-center text-[10px] leading-relaxed font-bold">
            Klikom na &quot;Potvrdi i Plati&quot;, prihvatate naše Uslove Korišćenja i Politiku
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
