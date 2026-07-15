export const CART_SYNC_CHANNEL = "splash-cart-sync";
export const CART_UPDATED_EVENT = "CART_UPDATED" as const;

export type CartSyncMessage = {
  type: typeof CART_UPDATED_EVENT;
};

export function broadcastCartUpdated() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return;
  }
  try {
    const channel = new BroadcastChannel(CART_SYNC_CHANNEL);
    channel.postMessage({ type: CART_UPDATED_EVENT } satisfies CartSyncMessage);
    channel.close();
  } catch {
    // BroadcastChannel may be unavailable in some browsers/tests.
  }
}

export function subscribeToCartUpdates(onUpdate: () => void) {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return () => undefined;
  }

  try {
    const channel = new BroadcastChannel(CART_SYNC_CHANNEL);
    channel.onmessage = (event: MessageEvent<CartSyncMessage>) => {
      if (event.data?.type === CART_UPDATED_EVENT) {
        onUpdate();
      }
    };
    return () => channel.close();
  } catch {
    return () => undefined;
  }
}
