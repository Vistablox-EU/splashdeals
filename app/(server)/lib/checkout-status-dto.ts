import "server-only";

export type CheckoutStatusTransaction = {
  id: string;
  status: string;
  totalAmount: unknown;
  issuedTickets: Array<{
    id: string;
    qrHash: string;
    ticketPrice: {
      label: string | null;
      ticketType: {
        title: string;
        category: {
          facility: { name: string; city: string };
        };
      };
    };
  }>;
};

export function toCheckoutStatusDto(transaction: CheckoutStatusTransaction) {
  return {
    id: transaction.id,
    status: transaction.status,
    totalAmount: Number(transaction.totalAmount),
    issuedTickets: transaction.issuedTickets.map((issuedTicket) => ({
      id: issuedTicket.id,
      qrHash: issuedTicket.qrHash,
      ticket: {
        title: issuedTicket.ticketPrice.ticketType.title,
        description: issuedTicket.ticketPrice.label,
        facility: {
          name: issuedTicket.ticketPrice.ticketType.category.facility.name,
          location: issuedTicket.ticketPrice.ticketType.category.facility.city,
        },
      },
    })),
  };
}
