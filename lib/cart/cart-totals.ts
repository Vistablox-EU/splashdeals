import type { CartItem } from "@/lib/types/cart";

export function getCartTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export function getCartTotalPrice(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * (item.quantity || 0), 0);
}
