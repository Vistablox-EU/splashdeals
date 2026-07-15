/**
 * Pure helpers for cart ticket availability checks.
 * Used by cart mutations and batch reconcile to avoid N+1 lookups.
 */

export type CanonicalTicketLike = {
  isActive: boolean;
  validFrom?: Date | null;
  validTo?: Date | null;
  saleStart?: Date | null;
  saleEnd?: Date | null;
  ticketType: {
    isActive: boolean;
    category: {
      isActive: boolean;
      facility: {
        status: string;
      };
    };
  };
};

export function isCanonicalTicketAvailable(
  ticketPrice: CanonicalTicketLike | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!ticketPrice) return false;

  return !(
    !ticketPrice.isActive ||
    !ticketPrice.ticketType.isActive ||
    !ticketPrice.ticketType.category.isActive ||
    ticketPrice.ticketType.category.facility.status !== "ACTIVE" ||
    (ticketPrice.validFrom != null && ticketPrice.validFrom > now) ||
    (ticketPrice.validTo != null && ticketPrice.validTo < now) ||
    (ticketPrice.saleStart != null && ticketPrice.saleStart > now) ||
    (ticketPrice.saleEnd != null && ticketPrice.saleEnd < now)
  );
}
