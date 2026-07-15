/**
 * Cart count helpers for facility ticket UI.
 * Cart items store ticketPriceId as `ticketId`.
 */

export type CartCountItem = {
  ticketId: string;
  quantity: number;
  title?: string;
};

export type ProductPriceMap = Record<
  string,
  {
    prices?: Array<{ id: string }>;
  }
>;

/** Sum quantities for a product tier using price ids from ticketProductMap. */
export function getCartCountForTier(
  items: CartCountItem[],
  tierId: string,
  ticketProductMap?: ProductPriceMap | null,
  tierTitle?: string,
  tierLabel?: string,
): number {
  const prices = ticketProductMap?.[tierId]?.prices;
  if (prices && prices.length > 0) {
    const ids = new Set(prices.map((p) => p.id));
    return items.filter((i) => ids.has(i.ticketId)).reduce((sum, i) => sum + i.quantity, 0);
  }

  // Fallback when product map missing: title match against hydrated cart titles
  const needles = [tierTitle, tierLabel].filter(Boolean) as string[];
  if (needles.length === 0) return 0;
  return items
    .filter((i) => needles.some((n) => (i.title || "").includes(n)))
    .reduce((sum, i) => sum + i.quantity, 0);
}
