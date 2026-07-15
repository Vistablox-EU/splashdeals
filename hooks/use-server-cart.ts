"use client";

import { create } from "zustand";
import { getCartAction } from "@/app/(server)/actions/cart";
import type { CartItem } from "@/lib/types/cart";
import { getCartTotalItems, getCartTotalPrice } from "@/lib/cart/cart-totals";
import { broadcastCartUpdated, subscribeToCartUpdates } from "@/lib/cart/cart-sync";

type ServerCartState = {
  items: CartItem[];
  isLoading: boolean;
  isHydrated: boolean;
  totalItems: number;
  totalPrice: number;
  setItems: (items: CartItem[]) => void;
  refresh: () => Promise<CartItem[]>;
  notifyUpdated: () => void;
};

let subscriptionStarted = false;

function ensureCartSyncSubscription(getState: () => ServerCartState) {
  if (subscriptionStarted || typeof window === "undefined") return;
  subscriptionStarted = true;
  subscribeToCartUpdates(() => {
    void getState().refresh();
  });
}

export const useServerCart = create<ServerCartState>((set, get) => ({
  items: [],
  isLoading: false,
  isHydrated: false,
  totalItems: 0,
  totalPrice: 0,
  setItems: (items) => {
    set({
      items,
      totalItems: getCartTotalItems(items),
      totalPrice: getCartTotalPrice(items),
      isHydrated: true,
      isLoading: false,
    });
  },
  refresh: async () => {
    ensureCartSyncSubscription(get);
    set({ isLoading: true });
    try {
      const result = await getCartAction();
      const items = result.success ? ((result.data?.items || []) as CartItem[]) : [];
      get().setItems(items);
      return items;
    } catch {
      set({ isLoading: false, isHydrated: true });
      return get().items;
    }
  },
  notifyUpdated: () => {
    broadcastCartUpdated();
  },
}));

export function useCartBadgeCount() {
  return useServerCart((state) => state.totalItems);
}

export function useCartItems() {
  return useServerCart((state) => state.items);
}
