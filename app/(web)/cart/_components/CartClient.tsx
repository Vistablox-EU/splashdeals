"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import type { CartItem, DiscountInfo, CartDictionary, IdentityDictionary } from "@/lib/types/cart";
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
  dict: {
    cart?: CartDictionary;
    identity?: IdentityDictionary;
  } & Record<string, unknown>;
  checkoutCancelled?: boolean;
}) {
  const cartDict = dict.cart;
  const identityDict = dict.identity;
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
  const [isBootstrapping, setIsBootstrapping] = React.useState(true);
  const [mutatingItemId, setMutatingItemId] = React.useState<string | null>(null);
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

  /** Soft refresh after qty/remove — no full reconcile (reconcile is mount/claim only). */
  const softRefresh = React.useCallback(async () => {
    await refresh();
  }, [refresh]);

  /** Full reconcile + refresh (mount / conflict / cancel). */
  const reconcileAndRefresh = React.useCallback(async () => {
    const reconcile = await reconcileCartAction();
    if (reconcile.success && reconcile.data) {
      setRemovedItems(reconcile.data.removedItems);
      setChangedItems(reconcile.data.changedItems);
    }
    await refresh();
  }, [refresh]);

  /** Revalidate applied promo against the latest store cart (after mutations). */
  const revalidateAppliedPromo = React.useCallback(
    async (applied: DiscountInfo | null) => {
      if (!applied?.code) return;

      const nextItems = useServerCart.getState().items;
      if (nextItems.length === 0) {
        setDiscount(null);
        setPromoError("");
        return;
      }

      const facilityId = nextItems[0]?.facilityId;
      const nextTotal = nextItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const result = await validatePromoCodeAction(applied.code, facilityId, nextTotal);

      if (result.success && result.data?.valid) {
        setDiscount({
          campaignId: result.data.campaignId,
          code: applied.code,
          discountPercent: result.data.discountPercent,
        });
        return;
      }

      setDiscount(null);
      const message = cartDict?.promo_cleared || cartDict?.promo_invalid || "";
      setPromoError(message);
      if (message) toast.info(message);
    },
    [cartDict?.promo_cleared, cartDict?.promo_invalid],
  );

  // Wait for auth resolution, claim only when authenticated, then reconcile once.
  React.useEffect(() => {
    if (isAuthPending) return;

    let active = true;
    const timer = requestAnimationFrame(async () => {
      setIsMounted(true);
      setIsBootstrapping(true);
      try {
        if (!claimHandledRef.current) {
          claimHandledRef.current = true;
          if (authSession?.user) {
            const claim = await claimGuestCartAction();
            if (!active) return;
            if (claim.success && claim.data?.action === "conflict") {
              setConflict({
                guestFacilityName: claim.data.guestFacilityName,
                userFacilityName: claim.data.userFacilityName,
              });
            }
          }
        }
        await reconcileAndRefresh();
      } finally {
        if (active) setIsBootstrapping(false);
      }
    });
    return () => {
      active = false;
      cancelAnimationFrame(timer);
    };
  }, [isAuthPending, authSession?.user, reconcileAndRefresh]);

  const handleResolveConflict = async (choice: "guest" | "user") => {
    setResolvingConflict(true);
    try {
      const result = await resolveGuestCartConflictAction({ choice });
      if (!result.success) {
        toast.error(result.error || cartDict?.conflict_resolve_error);
        return;
      }
      setConflict(null);
      toast.success(
        choice === "guest" ? cartDict?.conflict_kept_guest : cartDict?.conflict_kept_user,
      );
      await reconcileAndRefresh();
      await revalidateAppliedPromo(discount);
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
          toast.info(cartDict?.checkout_cancelled);
          await reconcileAndRefresh();
          window.history.replaceState({}, "", "/cart");
        } else {
          toast.error(result.error || cartDict?.checkout_cancel_error);
        }
      })
      .catch(() => {
        if (active) toast.error(cartDict?.checkout_cancel_error);
      });

    return () => {
      active = false;
    };
  }, [checkoutCancelled, reconcileAndRefresh, cartDict]);

  if (!isMounted || isBootstrapping || isAuthPending) {
    return (
      <div className="mx-auto min-h-[50vh] max-w-7xl px-4 pt-8 pb-28 sm:px-12 sm:pt-12 sm:pb-32">
        <div className="bg-muted/30 mb-6 h-8 w-40 animate-pulse rounded-lg" />
        <div className="bg-muted/20 h-28 animate-pulse rounded-2xl" />
      </div>
    );
  }

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    setMutatingItemId(itemId);
    const previousItems = useServerCart.getState().items;
    // Optimistic UI so mobile steppers feel instant
    if (newQuantity <= 0) {
      useServerCart.getState().setItems(previousItems.filter((i) => i.id !== itemId));
    } else {
      useServerCart
        .getState()
        .setItems(
          previousItems.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i)),
        );
    }
    try {
      const result =
        newQuantity <= 0
          ? await removeFromCartAction({ itemId })
          : await updateCartQuantityAction({ itemId, quantity: newQuantity });

      if (!result.success) {
        useServerCart.getState().setItems(previousItems);
        toast.error(result.error || cartDict?.update_error);
        await softRefresh();
        return;
      }

      await softRefresh();
      notifyUpdated();
      await revalidateAppliedPromo(discount);
    } catch {
      useServerCart.getState().setItems(previousItems);
      toast.error(cartDict?.update_error);
    } finally {
      setMutatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setMutatingItemId(itemId);
    const previousItems = useServerCart.getState().items;
    // Optimistic remove — critical on mobile where network lag looks like “nothing happens”
    useServerCart.getState().setItems(previousItems.filter((i) => i.id !== itemId));
    try {
      const result = await removeFromCartAction({ itemId });
      if (!result.success) {
        useServerCart.getState().setItems(previousItems);
        toast.error(result.error || cartDict?.remove_error);
        await softRefresh();
        return;
      }

      // Re-fetch authoritative cart (stale overlapping refreshes are dropped by generation token).
      await softRefresh();
      notifyUpdated();
      await revalidateAppliedPromo(discount);
    } catch {
      useServerCart.getState().setItems(previousItems);
      toast.error(cartDict?.remove_error);
    } finally {
      setMutatingItemId(null);
    }
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
        setPromoError("");
        toast.success(cartDict?.promo_applied);
      } else {
        const promoData = result.success ? result.data : null;
        setPromoError(
          promoData && !promoData.valid ? promoData.error : cartDict?.promo_invalid || "",
        );
      }
    } finally {
      setPromoLoading(false);
    }
  };

  const handleStartCheckout = () => {
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

      // Final integrity check before Stripe.
      await reconcileAndRefresh();

      const result = await createCheckoutSessionAction({
        holderName,
        holderPhotoUrl,
        promoCode: discount?.code ?? null,
      });

      if (!result.success) {
        if (result.error?.toLowerCase().includes("prijavljen")) {
          router.push(buildPrijavaUrl("/cart"));
          return;
        }
        throw new Error(result.error || cartDict?.checkout_start_error);
      }

      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        throw new Error(cartDict?.checkout_url_error);
      }
    } catch {
      toast.error(cartDict?.checkout_error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="mx-auto min-h-[50vh] max-w-7xl px-3 pt-6 pb-[calc(10.5rem+env(safe-area-inset-bottom,0px))] sm:px-12 sm:pt-12 sm:pb-32">
      <GuestCartConflictModal
        open={Boolean(conflict)}
        guestFacilityName={conflict?.guestFacilityName || ""}
        userFacilityName={conflict?.userFacilityName || ""}
        resolving={resolvingConflict}
        onChooseGuest={() => handleResolveConflict("guest")}
        onChooseUser={() => handleResolveConflict("user")}
        dict={cartDict}
      />
      <div className="mb-6 sm:mb-12">
        <p className="text-muted-foreground mb-2 text-[10px] font-black tracking-[0.2em] uppercase sm:mb-3">
          {cartDict?.title}
        </p>
        <h1 className="text-foreground text-2xl leading-none font-black tracking-tighter sm:text-5xl">
          {items.length > 0 ? `${items.length} ${cartDict?.items}` : cartDict?.empty}
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
            {cartDict?.empty_description}
          </p>
          <Link href="/akva-parkovi">
            <Button variant="ghost" className="mt-4 min-h-11 px-4">
              {cartDict?.browse}
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
              mutatingItemId={mutatingItemId}
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

      {items.length > 0 && (
        <div className="border-border/50 bg-background/98 pointer-events-auto fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-[999] border-t px-4 py-3 backdrop-blur-[40px] md:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                {cartDict?.total}
              </p>
              <p className="text-foreground text-lg leading-none font-black tabular-nums">
                {new Intl.NumberFormat("sr-RS").format(total)}{" "}
                <span className="text-primary text-xs">RSD</span>
              </p>
            </div>
            <Button
              onClick={handleStartCheckout}
              disabled={isCheckingOut}
              className="h-12 min-h-12 min-w-[9.5rem] shrink-0 touch-manipulation rounded-2xl px-5 text-sm font-bold"
            >
              {isCheckingOut ? cartDict?.processing : cartDict?.checkout}
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
        initialHolderName={authSession?.user?.name}
        dict={identityDict}
      />
    </div>
  );
}
