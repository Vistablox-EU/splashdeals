"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";
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

export function OrderDetail({
  transaction,
  dict,
}: {
  transaction: TransactionData;
  dict?: Record<string, any>;
}) {
  const t = (dict?.order_detail as Record<string, any>) || {};
  const statusColor =
    transaction.status === "COMPLETED"
      ? "text-primary"
      : transaction.status === "PENDING"
        ? "text-muted-foreground"
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
      toast.success(t.resend_success || "Email sa kartama je ponovo poslat!");
    } else {
      toast.error(t.resend_error || "Greška pri slanju email-a.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-3xl font-black tracking-tighter uppercase italic">
            {t.title || "Porudžbina"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            #{transaction.orderRef || transaction.id.slice(0, 8)}
          </p>
        </div>
        <div className={`flex items-center gap-2 text-sm font-bold ${statusColor}`}>
          <span className="flex h-2 w-2 rounded-full bg-current" />
          {transaction.status === "COMPLETED"
            ? t.status_completed || "Završeno"
            : transaction.status === "PENDING"
              ? t.status_pending || "U obradi"
              : t.status_cancelled || "Otkazano"}
        </div>
      </div>

      {/* Summary */}
      <Card className="bg-muted/20 border-border space-y-4 p-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.purchase_date || "Datum kupovine"}</span>
          <span className="text-foreground font-medium">{formatDate(transaction.createdAt)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t.facility || "Objekat"}</span>
          <span className="text-foreground font-medium">
            {transaction.facility?.name || t.unknown_facility || "Nepoznato"}
          </span>
        </div>
        <div className="border-border flex justify-between border-t pt-4 text-base">
          <span className="text-foreground font-bold">{t.total_paid || "Ukupno plaćeno"}</span>
          <span className="text-foreground text-xl font-black tracking-tight">
            {formatPrice(Number(transaction.totalAmount))} {transaction.currency}
          </span>
        </div>
      </Card>

      {/* Tickets */}
      <div className="space-y-4">
        <h2 className="text-foreground text-sm font-black tracking-widest uppercase">
          {t.tickets_label || "Ulaznice"} ({transaction.issuedTickets.length})
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
                        ? "bg-primary/10 text-primary"
                        : ticket.status === "USED"
                          ? "bg-muted/50 text-muted-foreground"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {ticket.status === "ACTIVE"
                      ? t.ticket_active || "Aktivna"
                      : ticket.status === "USED"
                        ? t.ticket_used || "Iskorišćena"
                        : t.ticket_invalid || "Nevažeća"}
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
                    {t.valid_until || "Važi do:"} {formatDate(ticket.expiryDate)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="sm" className="h-11 gap-2" onClick={handleResend}>
          <Icon name="mail" className="text-[16px]" />
          {t.resend_email || "Pošalji ponovo email"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="h-11 gap-2">
          <Icon name="print" className="text-[16px]" />
          {t.print || "Štampaj"}
        </Button>
        {transaction.issuedTickets.map((ticket) => (
          <Button key={ticket.id} asChild variant="outline" size="sm" className="h-11">
            <Link href={`/api/wallet/apple?qrHash=${ticket.qrHash}`} className="gap-2">
              <Icon name="download" className="text-[16px]" />
              {t.add_to_wallet || "Dodaj u Wallet"}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
