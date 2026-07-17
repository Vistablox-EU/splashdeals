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
    // reset tab id so next test gets a clean source
    delete (window as Window & { __sd_cart_tab_id?: string }).__sd_cart_tab_id;
  });

  it("ignores same-tab broadcasts (prevents remove/refresh races)", () => {
    vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
    const onUpdate = vi.fn();
    const unsubscribe = subscribeToCartUpdates(onUpdate);

    broadcastCartUpdated();

    // Same tab shares source id — must not refresh itself.
    expect(onUpdate).toHaveBeenCalledTimes(0);
    expect(CART_SYNC_CHANNEL).toBe("splash-cart-sync");
    expect(CART_UPDATED_EVENT).toBe("CART_UPDATED");
    unsubscribe();
  });

  it("delivers CART_UPDATED to a different tab source", () => {
    vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
    const onUpdate = vi.fn();
    const unsubscribe = subscribeToCartUpdates(onUpdate);

    // Simulate another tab with a different source id.
    const foreign = new MockBroadcastChannel(CART_SYNC_CHANNEL);
    foreign.postMessage({ type: CART_UPDATED_EVENT, source: "other-tab" });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
