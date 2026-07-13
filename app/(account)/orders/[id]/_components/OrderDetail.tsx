"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { toast } from "sonner";
import { resendConfirmationAction } from "@/app/(server)/actions/checkout";

interface TicketData {
  id: string;
  qrHash: string;
  status: string;
  expiryDate: string;
  usageCount: number;
  usageLimit: number;
  holderName: string | null;
  ticketPrice: {
    id: string;
    title: string;
    price: number;
    ticketType: {
      title: string;
      category: {
        name: string;
        facility: {
          id: string;
          name: string;
          slug: string;
        };
      };
    };
  };
}

interface TransactionData {
  id: string;
  orderRef: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  stripeSession: string;
  ticketDetails: unknown;
  facility: { name: string; slug: string } | null;
  issuedTickets: TicketData[];
}

export function OrderDetail({ transaction }: { transaction: TransactionData }) {
  const statusColor =
    transaction.status === "COMPLETED"
      ? "text-emerald-500"
      : transaction.status === "PENDING"
        ? "text-amber-500"
        : "text-destructive";

  const formatPrice = (price: number) => new Intl.NumberFormat("sr-RS").format(price);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("sr-RS", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleResend = async () => {
    const result = await resendConfirmationAction(transaction.id);
    if (result.success) {
      toast.success("Email sa kartama je ponovo poslat!");
    } else {
      toast.error("Greška pri slanju email-a.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-black tracking-tighter uppercase italic">
            Porudžbina
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            #{transaction.orderRef || transaction.id.slice(0, 8)}
          </p>
        </div>
        <div className={`flex items-center gap-2 text-sm font-bold ${statusColor}`}>
          <span className="flex h-2 w-2 rounded-full bg-current" />
          {transaction.status === "COMPLETED"
            ? "Završeno"
            : transaction.status === "PENDING"
              ? "U obradi"
              : "Otkazano"}
        </div>
      </div>

      {/* Summary */}
      <Card className="bg-muted/20 border-border space-y-4 p-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Datum kupovine</span>
          <span className="text-foreground font-medium">{formatDate(transaction.createdAt)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Objekat</span>
          <span className="text-foreground font-medium">
            {transaction.facility?.name || "Nepoznato"}
          </span>
        </div>
        <div className="border-border flex justify-between border-t pt-4 text-base">
          <span className="text-foreground font-bold">Ukupno plaćeno</span>
          <span className="text-foreground text-xl font-black tracking-tight">
            {formatPrice(Number(transaction.totalAmount))} {transaction.currency}
          </span>
        </div>
      </Card>

      {/* Tickets */}
      <div className="space-y-4">
        <h2 className="text-foreground text-sm font-black tracking-widest uppercase">
          Ulaznice ({transaction.issuedTickets.length})
        </h2>
        {transaction.issuedTickets.map((ticket) => (
          <Card key={ticket.id} className="bg-muted/20 border-border overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
                    {ticket.ticketPrice?.ticketType?.category?.name || "Ulaznica"}
                  </p>
                  <h3 className="text-foreground mt-1 text-lg font-black tracking-tight">
                    {ticket.ticketPrice?.title || ticket.ticketPrice?.ticketType?.title || "Karta"}
                  </h3>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {ticket.ticketPrice?.ticketType?.category?.facility?.name}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                      ticket.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : ticket.status === "USED"
                          ? "bg-muted/50 text-muted-foreground"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {ticket.status === "ACTIVE"
                      ? "Aktivna"
                      : ticket.status === "USED"
                        ? "Iskorišćena"
                        : "Nevažeća"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                {ticket.holderName && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Icon name="person" className="text-muted-foreground text-[14px]" />
                    <span className="text-muted-foreground">{ticket.holderName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs">
                  <Icon name="calendar_today" className="text-muted-foreground text-[14px]" />
                  <span className="text-muted-foreground">
                    Važi do: {formatDate(ticket.expiryDate)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <LiquidButton variant="secondary" size="sm" onClick={handleResend}>
          <Icon name="mail" className="text-[16px]" />
          Pošalji ponovo email
        </LiquidButton>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
          <Icon name="print" className="text-[16px]" />
          Štampaj
        </Button>
      </div>
    </div>
  );
}
