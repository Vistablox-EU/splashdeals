import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  ticketId: string;
  quantity: number;
  title: string;
  price: number;
  currency: string;
  facilityId?: string;
  facilityName?: string;
  category?: string;
  validityType?: string;
  requiresIdentity?: boolean;
  requiresPhoto?: boolean;
  imageUrl?: string | null;
  minPeople?: number;
  maxPeople?: number | null;
  updatedAt: number; // Unix ms (Date.now()) for conflict resolution
}

interface CartStore {
  items: CartItem[];
  lastUpdated: number;
  addItem: (item: Omit<CartItem, 'id' | 'updatedAt'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearStaleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  syncFromTab: (items: CartItem[]) => void;
}

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
export const MAX_QUANTITY_PER_ITEM = 20;

/**
 * Merges two cart arrays. For the same ID, the one with the later updatedAt wins.
 */
const mergeCartItems = (current: CartItem[], incoming: CartItem[]): CartItem[] => {
  const map = new Map<string, CartItem>();
  
  [...current, ...incoming].forEach(item => {
    const existing = map.get(item.id);
    if (!existing || item.updatedAt > existing.updatedAt) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
};

const generateItemId = (ticketId: string, facilityId?: string) => {
  return `${ticketId}-${facilityId || 'unknown'}`;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      lastUpdated: Date.now(),
      
      addItem: (item) => {
        const id = generateItemId(item.ticketId, item.facilityId);
        const currentItems = get().items;
        const now = Date.now();
        const existingItemIndex = currentItems.findIndex((i) => i.id === id);

        if (existingItemIndex > -1) {
          const newItems = [...currentItems];
          const newQuantity = Math.min(newItems[existingItemIndex].quantity + item.quantity, MAX_QUANTITY_PER_ITEM);
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newQuantity,
            updatedAt: now
          };
          set({ items: newItems, lastUpdated: now });
        } else {
          set({ 
            items: [
              ...currentItems, 
              { ...item, quantity: Math.min(item.quantity, MAX_QUANTITY_PER_ITEM), id, updatedAt: now }
            ],
            lastUpdated: now
          });
        }
      },

      removeItem: (id) => {
        const now = Date.now();
        set({ 
          items: get().items.filter((i) => i.id !== id),
          lastUpdated: now 
        });
      },

      updateQuantity: (id, quantity) => {
        const now = Date.now();
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        const cappedQuantity = Math.min(quantity, MAX_QUANTITY_PER_ITEM);

        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: cappedQuantity, updatedAt: now } : i
          ),
          lastUpdated: now
        });
      },

      clearCart: () => set({ items: [], lastUpdated: Date.now() }),

      clearStaleCart: () => {
        const now = Date.now();
        const last = get().lastUpdated;
        if (last && (now - last) > STALE_THRESHOLD_MS) {
          set({ items: [], lastUpdated: now });
          console.log('Cart cleared: stale after 30min');
        }
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      syncFromTab: (incomingItems) => {
        const merged = mergeCartItems(get().items, incomingItems);
        set({ items: merged, lastUpdated: Date.now() });
      }
    }),
    {
      name: 'splash-cart-storage',
    }
  )
);

// ──────────────────────────────────────────────
// Cross-Tab Synchronization Logic
// ──────────────────────────────────────────────
/**
 * 🔄 Cart Sync Orchestrator
 * Ensures cross-tab synchronization only after hydration is stable.
 */
export const initCartSync = () => {
  if (typeof window === 'undefined') return () => {};

  const channel = new BroadcastChannel('splash-cart-sync');
  let lastBroadcastedState = JSON.stringify(useCart.getState().items);

  const unsubscribe = useCart.subscribe((state) => {
    const currentState = JSON.stringify(state.items);
    if (currentState !== lastBroadcastedState) {
      lastBroadcastedState = currentState;
      channel.postMessage({ type: 'CART_UPDATED', items: state.items });
    }
  });

  channel.onmessage = (event) => {
    if (event.data.type === 'CART_UPDATED') {
      const incomingState = JSON.stringify(event.data.items);
      if (incomingState !== JSON.stringify(useCart.getState().items)) {
        useCart.getState().syncFromTab(event.data.items);
        lastBroadcastedState = incomingState;
      }
    }
  };

  return () => {
    unsubscribe();
    channel.close();
  };
};

