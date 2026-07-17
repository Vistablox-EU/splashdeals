export const CART_SYNC_CHANNEL = "splash-cart-sync";
export const CART_UPDATED_EVENT = "CART_UPDATED" as const;

export type CartSyncMessage = {
  type: typeof CART_UPDATED_EVENT;
  /** Tab id — same-tab listeners ignore their own broadcasts. */
  source: string;
};

function getTabSourceId(): string {
  if (typeof window === "undefined") return "ssr";
  const key = "__sd_cart_tab_id";
  const w = window as Window & { [key]?: string };
  if (!w[key]) {
    w[key] = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
  return w[key]!;
}

export function broadcastCartUpdated() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return;
  }
  try {
    const channel = new BroadcastChannel(CART_SYNC_CHANNEL);
    channel.postMessage({
      type: CART_UPDATED_EVENT,
      source: getTabSourceId(),
    } satisfies CartSyncMessage);
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
    const sourceId = getTabSourceId();
    const channel = new BroadcastChannel(CART_SYNC_CHANNEL);
    channel.onmessage = (event: MessageEvent<CartSyncMessage>) => {
      if (event.data?.type !== CART_UPDATED_EVENT) return;
      // Ignore same-tab echoes (would race with optimistic remove + softRefresh).
      if (event.data.source && event.data.source === sourceId) return;
      onUpdate();
    };
    return () => channel.close();
  } catch {
    return () => undefined;
  }
}
