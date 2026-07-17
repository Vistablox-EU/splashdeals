"use client";

import * as React from "react";
import { useServerCart } from "@/hooks/use-server-cart";
import { authClient } from "@/lib/auth-client";
import { claimGuestCartAction } from "@/app/(server)/actions/guest-cart-claim";

/**
 * Mount once in the web shell to hydrate shared cart badge/drawer state
 * and keep BroadcastChannel subscribers live.
 *
 * On auth session appearance, claim/merge guest cart before refresh so
 * social login does not leave the badge empty until /cart mounts.
 *
 * Claim is once per browser tab session per userId (sessionStorage) so
 * remounts after remove cannot re-import a leftover guest cart.
 */
export function CartStateBootstrap() {
  const refresh = useServerCart((state) => state.refresh);
  const { data: authSession, isPending: isAuthPending } = authClient.useSession();
  const claimedForUserRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (isAuthPending) return;

    let active = true;
    const userId = authSession?.user?.id ?? null;

    void (async () => {
      if (userId && claimedForUserRef.current !== userId) {
        claimedForUserRef.current = userId;
        const claimKey = `sd_guest_claim:${userId}`;
        const alreadyClaimed =
          typeof window !== "undefined" && sessionStorage.getItem(claimKey) === "1";
        if (!alreadyClaimed) {
          try {
            await claimGuestCartAction();
            if (typeof window !== "undefined") {
              sessionStorage.setItem(claimKey, "1");
            }
          } catch {
            // Non-fatal — cart page mount can still claim once.
          }
        }
      }
      if (!userId) {
        claimedForUserRef.current = null;
      }
      if (active) {
        await refresh();
      }
    })();

    return () => {
      active = false;
    };
  }, [isAuthPending, authSession?.user?.id, refresh]);

  return null;
}
