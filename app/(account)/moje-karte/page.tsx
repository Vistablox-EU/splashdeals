import { prisma } from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";
import { getDictionary } from "@/lib/dictionaries";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";

async function getUserTickets(userId: string) {
  return prisma.issuedTicket.findMany({
    where: { userId },
    include: {
      ticketPrice: {
        include: {
          ticketType: {
            include: {
              category: {
                include: { facility: { select: { id: true, name: true, slug: true } } },
              },
            },
          },
        },
      },
      transaction: { select: { orderRef: true, totalAmount: true, createdAt: true } },
    },
    orderBy: { expiryDate: "asc" },
  });
}

export default async function MojeKartePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const dict = await getDictionary();
  const t = dict.account;

  if (!session) return null; // proxy.ts handles redirect

  const tickets = await getUserTickets(session.user.id);
  const activeTickets = tickets.filter((t) => t.status === "ACTIVE" && t.usageCount < t.usageLimit);
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">{t.moje_karte}</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">{session.user.name}</p>
      </div>

      {activeTickets.length === 0 ? (
        <Card className="border-border flex flex-col items-center gap-4 p-12 text-center">
          <Icon name="confirmation_number" className="text-muted-foreground size-12" />
          <div>
            <p className="mb-1 font-bold">{t.no_tickets}</p>
            <p className="text-muted-foreground text-sm">{t.no_tickets_desc}</p>
          </div>
          <Link
            href="/"
            className="bg-primary text-primary-foreground rounded-full px-6 py-2 text-sm font-bold"
          >
            {t.browse_facilities}
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeTickets.map((ticket) => {
            const facility = ticket.ticketPrice?.ticketType?.category?.facility;
            const isExpiring = ticket.expiryDate < sevenDaysFromNow;
            return (
              <Card key={ticket.id} className="border-border flex flex-col overflow-hidden">
                <div className="flex items-start justify-between border-b p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{facility?.name || "Objekat"}</p>
                    <p className="text-muted-foreground text-[11px] font-medium">
                      {ticket.ticketPrice?.ticketType?.title}
                    </p>
                  </div>
                  <Badge
                    variant={isExpiring ? "secondary" : "default"}
                    className="shrink-0 text-[9px]"
                  >
                    {isExpiring
                      ? `${t.ticket_expires} ${ticket.expiryDate.toLocaleDateString("sr-Latn")}`
                      : t.ticket_active}
                  </Badge>
                </div>
                <div className="flex flex-col gap-3 p-4">
                  <div className="bg-muted relative mx-auto aspect-square w-32 overflow-hidden rounded-xl">
                    {ticket.qrHash && (
                      <Image
                        src={`/api/qr/${ticket.qrHash}`}
                        alt="QR kod"
                        fill
                        className="object-contain p-1"
                      />
                    )}
                  </div>
                  <div className="text-muted-foreground text-center text-[10px] font-medium">
                    {ticket.transaction?.orderRef && (
                      <span>
                        {t.order_ref}: {ticket.transaction.orderRef}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
