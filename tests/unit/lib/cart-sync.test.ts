/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CART_SYNC_CHANNEL,
  CART_UPDATED_EVENT,
  broadcastCartUpdated,
  subscribeToCartUpdates,
} from "@/lib/cart/cart-sync";

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(data: unknown) {
    for (const instance of MockBroadcastChannel.instances) {
      if (instance !== this && instance.name === this.name && instance.onmessage) {
        instance.onmessage({ data } as MessageEvent);
      }
    }
  }

  close() {
    MockBroadcastChannel.instances = MockBroadcastChannel.instances.filter((i) => i !== this);
  }
}

describe("cart sync channel", () => {
  afterEach(() => {
    MockBroadcastChannel.instances = [];
    vi.unstubAllGlobals();
  });

  it("broadcasts CART_UPDATED on the shared channel name", () => {
    vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
    const onUpdate = vi.fn();
    const unsubscribe = subscribeToCartUpdates(onUpdate);

    broadcastCartUpdated();

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(CART_SYNC_CHANNEL).toBe("splash-cart-sync");
    expect(CART_UPDATED_EVENT).toBe("CART_UPDATED");
    unsubscribe();
  });
});
