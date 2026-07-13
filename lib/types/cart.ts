/**
 * 🛒 Shared cart types used by both the client-side Zustand store
 * and the server-side cart session actions.
 */

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

export interface DiscountInfo {
  campaignId: string;
  code: string;
  discountPercent: number;
}

export const MAX_QUANTITY_PER_ITEM = 20;
