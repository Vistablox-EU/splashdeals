/**
 * 🛒 Shared cart types for the cart session and normalized items.
 *
 * CartItem matches the CartSessionItem Prisma model.
 * CartItemInput is the only cart metadata trusted from the client.
 * All display, price, facility, and restriction fields are hydrated server-side.
 */

export interface CartItem {
  id: string;
  ticketId: string;
  quantity: number;
  title: string;
  price: number;
  currency: string;
  facilityId: string;
  facilityName?: string;
  category?: string;
  validityType?: string;
  requiresIdentity?: boolean;
  requiresPhoto?: boolean;
  imageUrl?: string | null;
  minPeople?: number;
  maxPeople?: number | null;
  updatedAt: number; // Unix ms for conflict resolution
}

export interface CartItemInput {
  ticketPriceId: string;
  quantity: number;
}

export interface DiscountInfo {
  campaignId: string;
  code: string;
  discountPercent: number;
}

/** Typed cart dictionary slice used by cart route components. */
export type CartDictionary = {
  title?: string;
  description?: string;
  terms_notice?: string;
  empty_title?: string;
  empty_subtitle?: string;
  items_count?: string;
  total_label?: string;
  checkout_button?: string;
  security_notice?: string;
  summary?: string;
  subtotal?: string;
  checkout?: string;
  processing?: string;
  discount?: string;
  total?: string;
  promo_placeholder?: string;
  promo_label?: string;
  apply?: string;
  remove?: string;
  promo_invalid?: string;
  promo_applied?: string;
  checkout_error?: string;
  items?: string;
  empty?: string;
  empty_description?: string;
  browse?: string;
  removed_notice?: string;
  price_changed_notice?: string;
  decrease_qty?: string;
  increase_qty?: string;
  close?: string;
  view_cart?: string;
};

export const MAX_QUANTITY_PER_ITEM = 50;
