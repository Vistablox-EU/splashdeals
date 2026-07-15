import { prisma } from "@/app/(server)/lib/prisma";
import { getDictionary } from "@/lib/dictionaries";
import { requireAccountSession } from "@/lib/auth/require-account-session";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Istorija kupovina",
  robots: { index: false, follow: false },
};

async function getUserHistory(userId: string) {
  return prisma.transaction.findMany({
    where: { userId },
    include: {
      issuedTickets: {
        include: {
          ticketPrice: {
            include: {
              ticketType: {
                include: {
                  category: { include: { facility: { select: { name: true } } } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function IstorijaPage() {
  const session = await requireAccountSession("/moje-karte/istorija");
  const dict = await getDictionary();
  const t = dict.account;

  const transactions = await getUserHistory(session.user.id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic">{t.istorija}</h1>

      {transactions.length === 0 ? (
        <Card className="border-border flex flex-col items-center gap-4 p-12 text-center">
          <Icon name="history" className="text-muted-foreground size-12" />
          <p className="text-muted-foreground text-sm font-medium">{t.no_history}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const firstTicket = tx.issuedTickets[0];
            const facilityName =
              firstTicket?.ticketPrice?.ticketType?.category?.facility?.name || "Objekat";
            return (
              <Link key={tx.id} href={`/orders/${tx.id}`} className="block">
                <Card className="border-border hover:border-primary/30 flex min-h-11 items-center justify-between p-4 transition-colors">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-bold">{facilityName}</p>
                    <p className="text-muted-foreground text-[11px] font-medium">
                      {t.order_ref}: {tx.orderRef}
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      {tx.createdAt.toLocaleDateString("sr-Latn")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-primary text-sm font-black">
                      {Number(tx.totalAmount).toLocaleString("sr-RS")} RSD
                    </p>
                    <p className="text-muted-foreground text-[10px] font-medium">
                      {tx.issuedTickets.length} karata
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
