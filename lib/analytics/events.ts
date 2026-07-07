import { sendGAEvent } from "@next/third-parties/google";

/**
 * 🌊 Splashdeals Google Analytics 4 Event Helpers
 *
 * Typed wrappers around sendGAEvent. Only fires in the browser
 * when the GA script is loaded (handled by @next/third-parties).
 *
 * Usage:
 *   import { trackAddToCart } from "@/lib/analytics/events";
 *   trackAddToCart({ ticketId: "...", facilityName: "...", price: 1500 });
 */

// ──────────────────────────────────────────────
// E-commerce: Add to Cart
// ──────────────────────────────────────────────

export function trackAddToCart(params: {
  ticketId: string;
  facilityName: string;
  ticketTitle: string;
  price: number;
  quantity: number;
  currency?: string;
}) {
  if (typeof window === "undefined") return;

  sendGAEvent("event", "add_to_cart", {
    currency: params.currency || "RSD",
    value: params.price * params.quantity,
    items: [
      {
        item_id: params.ticketId,
        item_name: `${params.facilityName} - ${params.ticketTitle}`,
        price: params.price,
        quantity: params.quantity,
      },
    ],
  });
}

// ──────────────────────────────────────────────
// E-commerce: Begin Checkout
// ──────────────────────────────────────────────

export function trackBeginCheckout(params: {
  items: Array<{
    ticketId: string;
    facilityName: string;
    ticketTitle: string;
    price: number;
    quantity: number;
  }>;
  currency?: string;
}) {
  if (typeof window === "undefined") return;

  const totalValue = params.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );

  sendGAEvent("event", "begin_checkout", {
    currency: params.currency || "RSD",
    value: totalValue,
    items: params.items.map((i) => ({
      item_id: i.ticketId,
      item_name: `${i.facilityName} - ${i.ticketTitle}`,
      price: i.price,
      quantity: i.quantity,
    })),
  });
}

// ──────────────────────────────────────────────
// E-commerce: Purchase (server-side via MP)
// ──────────────────────────────────────────────

/**
 * Returns the GA4 Measurement Protocol payload for a confirmed purchase.
 * Call this server-side from the Stripe webhook fulfillOrder().
 */
export function buildPurchasePayload(params: {
  transactionId: string;
  value: number;
  currency?: string;
  items: Array<{
    ticketId: string;
    itemName: string;
    price: number;
    quantity: number;
  }>;
  clientId?: string;
}) {
  return {
    client_id: params.clientId || "server-side",
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: params.transactionId,
          value: params.value,
          currency: params.currency || "RSD",
          items: params.items.map((i) => ({
            item_id: i.ticketId,
            item_name: i.itemName,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      },
    ],
  };
}

// ──────────────────────────────────────────────
// Engagement: View Facility
// ──────────────────────────────────────────────

export function trackViewFacility(params: {
  facilityName: string;
  facilitySlug: string;
  category: string;
}) {
  if (typeof window === "undefined") return;

  sendGAEvent("event", "view_item", {
    currency: "RSD",
    items: [
      {
        item_id: params.facilitySlug,
        item_name: params.facilityName,
        item_category: params.category,
      },
    ],
  });
}
