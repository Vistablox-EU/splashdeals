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
        try {
          await claimGuestCartAction();
        } catch {
          // Non-fatal — getCartAction also claims when user cart is empty.
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
