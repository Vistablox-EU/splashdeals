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
  promo_cleared?: string;
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
  conflict_title?: string;
  conflict_description?: string;
  conflict_guest_label?: string;
  conflict_user_label?: string;
  conflict_facility?: string;
  conflict_keep_guest?: string;
  conflict_keep_user?: string;
  conflict_resolve_error?: string;
  conflict_kept_guest?: string;
  conflict_kept_user?: string;
  checkout_cancelled?: string;
  checkout_cancel_error?: string;
  update_error?: string;
  remove_error?: string;
  checkout_start_error?: string;
  checkout_url_error?: string;
  default_category?: string;
};

/** Typed identity dialog dictionary slice (dictionaries/rs.json → identity). */
export type IdentityDictionary = {
  title?: string;
  description?: string;
  name_label?: string;
  name_placeholder?: string;
  name_hint?: string;
  name_required_error?: string;
  photo_label?: string;
  photo_hint?: string;
  photo_upload_aria?: string;
  photo_preview_alt?: string;
  click_to_add_photo?: string;
  add_photo_error?: string;
  save_error?: string;
  next?: string;
  back?: string;
  skip?: string;
  cancel?: string;
  confirm?: string;
  confirm_and_pay?: string;
  sending?: string;
  review_ready_title?: string;
  review_ready_subtitle?: string;
  pass_holder?: string;
  name_preview_label?: string;
  review_alt?: string;
};

export const MAX_QUANTITY_PER_ITEM = 50;
