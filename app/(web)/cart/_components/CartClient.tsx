"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import type { CartItem, DiscountInfo } from "@/lib/types/cart";
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
import { CartItemList } from "./CartItemList";
import { CartSummary } from "./CartSummary";

export function CartClient({ dict }: { dict: Record<string, any> }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [showIdentityDialog, setShowIdentityDialog] = React.useState(false);
  const [promoCode, setPromoCode] = React.useState("");
  const [promoError, setPromoError] = React.useState("");
  const [promoLoading, setPromoLoading] = React.useState(false);
  const [discount, setDiscount] = React.useState<DiscountInfo | null>(null);
  const [removedItems, _setRemovedItems] = React.useState<string[]>([]);
  const [changedItems, _setChangedItems] = React.useState<string[]>([]);

  const totalBeforeDiscount = items.reduce(
    (sum: number, i: CartItem) => sum + i.price * i.quantity,
    0,
  );
  const discountAmount = discount
    ? Math.round(totalBeforeDiscount * (discount.discountPercent / 100))
    : 0;
  const total = totalBeforeDiscount - discountAmount;
  const requiresIdentity = items.some((i) => i.requiresIdentity);
  const requiresPhoto = items.some((i) => i.requiresPhoto);

  // Load cart from server on mount
  const loadCart = React.useCallback(async () => {
    const result = await getCartAction();
    if (result.success && result.data) {
      setItems((result.data.items || []) as CartItem[]);
    }
  }, []);

  React.useEffect(() => {
    const timer = requestAnimationFrame(async () => {
      setIsMounted(true);
      await loadCart();
    });
    return () => cancelAnimationFrame(timer);
  }, [loadCart]);

  // 🔄 Tab sync — re-fetch cart when another tab updates it
  React.useEffect(() => {
    const channel = new BroadcastChannel("splash-cart-sync");
    channel.onmessage = (event) => {
      if (event.data?.type === "CART_UPDATED") {
        loadCart().catch(console.error);
      }
    };
    return () => channel.close();
  }, [loadCart]);

  // Broadcast cart changes to other tabs
  const broadcastCartUpdate = React.useCallback(() => {
    try {
      const channel = new BroadcastChannel("splash-cart-sync");
      channel.postMessage({ type: "CART_UPDATED" });
      channel.close();
    } catch {
      // BroadcastChannel may not be available
    }
  }, []);

  if (!isMounted) return null;

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
    broadcastCartUpdate();
  };

  const handleRemoveItem = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    await removeFromCartAction({ itemId }).catch(console.error);
    broadcastCartUpdate();
  };

  const handleApplyPromo = async () => {
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
        setPromoError(
          promoData && !promoData.valid
            ? promoData.error
            : dict?.cart?.promo_invalid || "Nevažeći promo kod",
        );
      }
    } finally {
      setPromoLoading(false);
    }
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
        items: items.map((i) => ({ ticketPriceId: i.ticketId, quantity: i.quantity })),
        holderName,
        holderPhotoUrl,
      });

      if (!result.success) throw new Error(result.error || "Failed to initialize checkout");

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
          <div className="space-y-6 lg:col-span-2">
            <CartItemList
              items={items}
              dict={dict}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveItem}
              removedItems={removedItems}
              changedItems={changedItems}
            />
          </div>
          <CartSummary
            totalBeforeDiscount={totalBeforeDiscount}
            total={total}
            discount={discount}
            dict={dict}
            promoCode={promoCode}
            promoError={promoError}
            promoLoading={promoLoading}
            isCheckingOut={isCheckingOut}
            onPromoCodeChange={(code) => {
              setPromoCode(code);
              setPromoError("");
            }}
            onApplyPromo={handleApplyPromo}
            onRemovePromo={() => setDiscount(null)}
            onCheckout={handleStartCheckout}
          />
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
