"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import type { CartItem, DiscountInfo, CartDictionary } from "@/lib/types/cart";
import { IdentitySetupDialog } from "@/components/shared/IdentitySetupDialog";
import {
  createCheckoutSessionAction,
  cancelCheckoutSessionAction,
} from "@/app/(server)/actions/checkout";
import { validatePromoCodeAction } from "@/app/(server)/actions/campaigns";
import {
  removeFromCartAction,
  updateCartQuantityAction,
  reconcileCartAction,
} from "@/app/(server)/actions/cart";
import {
  claimGuestCartAction,
  resolveGuestCartConflictAction,
} from "@/app/(server)/actions/guest-cart-claim";
import { trackBeginCheckout } from "@/lib/analytics/events";
import { useServerCart } from "@/hooks/use-server-cart";
import { authClient } from "@/lib/auth-client";
import { buildPrijavaUrl } from "@/lib/auth/callback-url";
import { CartItemList } from "./CartItemList";
import { CartSummary } from "./CartSummary";
import { GuestCartConflictModal } from "./GuestCartConflictModal";
import { useRouter } from "next/navigation";

export function CartClient({
  dict,
  checkoutCancelled = false,
}: {
  dict: { cart?: CartDictionary } & Record<string, unknown>;
  checkoutCancelled?: boolean;
}) {
  const router = useRouter();
  const { data: authSession, isPending: isAuthPending } = authClient.useSession();
  const items = useServerCart((s) => s.items);
  const refresh = useServerCart((s) => s.refresh);
  const notifyUpdated = useServerCart((s) => s.notifyUpdated);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [showIdentityDialog, setShowIdentityDialog] = React.useState(false);
  const [promoCode, setPromoCode] = React.useState("");
  const [promoError, setPromoError] = React.useState("");
  const [promoLoading, setPromoLoading] = React.useState(false);
  const [discount, setDiscount] = React.useState<DiscountInfo | null>(null);
  const [removedItems, setRemovedItems] = React.useState<string[]>([]);
  const [changedItems, setChangedItems] = React.useState<string[]>([]);
  const [conflict, setConflict] = React.useState<{
    guestFacilityName: string;
    userFacilityName: string;
  } | null>(null);
  const [resolvingConflict, setResolvingConflict] = React.useState(false);
  const claimHandledRef = React.useRef(false);

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
  const cartFacilityId = items[0]?.facilityId;

  // Load cart from server on mount and reconcile stale prices/availability.
  const loadCart = React.useCallback(async () => {
    const reconcile = await reconcileCartAction();
    if (reconcile.success && reconcile.data) {
      setRemovedItems(reconcile.data.removedItems);
      setChangedItems(reconcile.data.changedItems);
    }
    await refresh();
  }, [refresh]);

  React.useEffect(() => {
    const timer = requestAnimationFrame(async () => {
      setIsMounted(true);
      if (!claimHandledRef.current) {
        claimHandledRef.current = true;
        const claim = await claimGuestCartAction();
        if (claim.success && claim.data?.action === "conflict") {
          setConflict({
            guestFacilityName: claim.data.guestFacilityName,
            userFacilityName: claim.data.userFacilityName,
          });
        }
      }
      await loadCart();
    });
    return () => cancelAnimationFrame(timer);
  }, [loadCart]);

  const handleResolveConflict = async (choice: "guest" | "user") => {
    setResolvingConflict(true);
    try {
      const result = await resolveGuestCartConflictAction({ choice });
      if (!result.success) {
        toast.error(result.error || "Rešavanje konflikta nije uspelo.");
        return;
      }
      setConflict(null);
      toast.success(
        choice === "guest" ? "Zadržana je gostujuća korpa." : "Zadržana je korpa naloga.",
      );
      await loadCart();
    } finally {
      setResolvingConflict(false);
    }
  };

  const cancellationHandledRef = React.useRef(false);
  React.useEffect(() => {
    if (!checkoutCancelled || cancellationHandledRef.current) return;
    cancellationHandledRef.current = true;

    let active = true;
    cancelCheckoutSessionAction()
      .then(async (result) => {
        if (!active) return;
        if (result.success) {
          toast.info("Plaćanje je otkazano. Vaša korpa je sačuvana.");
          await loadCart();
          window.history.replaceState({}, "", "/cart");
        } else {
          toast.error(result.error || "Otkazivanje plaćanja nije uspelo.");
        }
      })
      .catch(() => {
        if (active) toast.error("Otkazivanje plaćanja nije uspelo.");
      });

    return () => {
      active = false;
    };
  }, [checkoutCancelled, loadCart]);

  // 🔄 Tab sync is handled by shared useServerCart BroadcastChannel subscription
  // Broadcast cart changes to other tabs
  const broadcastCartUpdate = React.useCallback(() => {
    notifyUpdated();
  }, [notifyUpdated]);

  if (!isMounted) {
    return (
      <div className="mx-auto min-h-[50vh] max-w-7xl px-4 pt-8 pb-28 sm:px-12 sm:pt-12 sm:pb-32">
        <div className="bg-muted/30 mb-6 h-8 w-40 animate-pulse rounded-lg" />
        <div className="bg-muted/20 h-28 animate-pulse rounded-2xl" />
      </div>
    );
  }

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    const result =
      newQuantity <= 0
        ? await removeFromCartAction({ itemId })
        : await updateCartQuantityAction({ itemId, quantity: newQuantity });

    if (!result.success) {
      toast.error(result.error || "Izmena korpe nije uspela.");
      await loadCart();
      return;
    }

    await loadCart();
    broadcastCartUpdate();
  };

  const handleRemoveItem = async (itemId: string) => {
    const result = await removeFromCartAction({ itemId });
    if (!result.success) {
      toast.error(result.error || "Uklanjanje stavke nije uspelo.");
      await loadCart();
      return;
    }

    await loadCart();
    broadcastCartUpdate();
  };

  const handleApplyPromo = async () => {
    setPromoLoading(true);
    try {
      const result = await validatePromoCodeAction(promoCode, cartFacilityId, totalBeforeDiscount);
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
    // Guest must sign in before Stripe — preserve cart via guest claim after login.
    if (!isAuthPending && !authSession?.user) {
      router.push(buildPrijavaUrl("/cart"));
      return;
    }

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
      if (!isAuthPending && !authSession?.user) {
        router.push(buildPrijavaUrl("/cart"));
        return;
      }

      setIsCheckingOut(true);
      setShowIdentityDialog(false);

      const result = await createCheckoutSessionAction({
        holderName,
        holderPhotoUrl,
        promoCode: discount?.code ?? null,
      });

      if (!result.success) {
        // Fallback: server auth failure still routes to login with return path
        if (result.error?.toLowerCase().includes("prijavljen")) {
          router.push(buildPrijavaUrl("/cart"));
          return;
        }
        throw new Error(result.error || "Pokretanje plaćanja nije uspelo.");
      }

      if (result.data?.url) {
        // The exact server cart remains locked until Stripe confirms, cancels, or expires.
        window.location.href = result.data.url;
      } else {
        throw new Error("Nije dobijena adresa za plaćanje.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nepoznata greška";
      toast.error(dict?.cart?.checkout_error || "Došlo je do greške. Pokušajte ponovo.");
      console.error("Checkout error:", message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 pt-8 pb-36 sm:px-12 sm:pt-12 sm:pb-32">
      <GuestCartConflictModal
        open={Boolean(conflict)}
        guestFacilityName={conflict?.guestFacilityName || ""}
        userFacilityName={conflict?.userFacilityName || ""}
        resolving={resolvingConflict}
        onChooseGuest={() => handleResolveConflict("guest")}
        onChooseUser={() => handleResolveConflict("user")}
      />
      <div className="mb-6 sm:mb-12">
        <p className="text-muted-foreground mb-2 text-[10px] font-black tracking-[0.2em] uppercase sm:mb-3">
          {dict?.cart?.title || "Vaša Korpa"}
        </p>
        <h1 className="text-foreground text-2xl leading-none font-black tracking-tighter sm:text-5xl">
          {items.length > 0
            ? `${items.length} ${dict?.cart?.items || "stavki"}`
            : dict?.cart?.empty || "Vaša korpa je prazna"}
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-10 sm:pt-20">
          <div className="bg-muted/20 flex h-20 w-20 items-center justify-center rounded-full sm:h-24 sm:w-24">
            <Icon
              name="shopping_bag"
              className="text-muted-foreground/30 text-[36px] sm:text-[40px]"
            />
          </div>
          <p className="text-muted-foreground mt-5 max-w-xs text-center text-sm font-medium sm:mt-6">
            {dict?.cart?.empty_description || "Izgleda da još uvek niste dodali karte."}
          </p>
          <Link href="/akva-parkovi">
            <Button variant="ghost" className="mt-4 min-h-11 px-4">
              {dict?.cart?.browse || "Pretraži akva parkove"}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="space-y-4 sm:space-y-6 lg:col-span-2">
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

      {/* Mobile sticky checkout — above bottom nav, same action as summary CTA */}
      {items.length > 0 && (
        <div className="border-border/50 bg-background/98 safe-area-bottom fixed inset-x-0 bottom-16 z-[999] border-t px-4 py-3 backdrop-blur-[40px] lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                {dict?.cart?.total || "Ukupno"}
              </p>
              <p className="text-foreground text-lg leading-none font-black tabular-nums">
                {new Intl.NumberFormat("sr-RS").format(total)}{" "}
                <span className="text-primary text-xs">RSD</span>
              </p>
            </div>
            <Button
              onClick={handleStartCheckout}
              disabled={isCheckingOut}
              className="h-12 min-w-[9.5rem] shrink-0 rounded-2xl px-5 text-sm font-bold"
            >
              {isCheckingOut
                ? dict?.cart?.processing || "Obrada..."
                : dict?.cart?.checkout || "Nastavi na Plaćanje"}
            </Button>
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
