import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { OrderDetail } from "./_components/OrderDetail";
import { getDictionary } from "@/lib/dictionaries";
import { requireAccountSession } from "@/lib/auth/require-account-session";

export const metadata: Metadata = {
  title: "Porudžbina | Splashdeals",
  robots: { index: false, follow: false },
};

export default async function OrderPage(props: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await props.params;

  const session = await requireAccountSession(`/orders/${id}`);

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
    include: {
      issuedTickets: {
        include: {
          ticketPrice: {
            include: {
              ticketType: {
                include: {
                  category: {
                    include: { facility: true },
                  },
                },
              },
            },
          },
        },
      },
      facility: true,
    },
  });

  if (!transaction) {
    notFound();
  }

  const serialized = JSON.parse(JSON.stringify(transaction));
  const dict = await getDictionary();

  return (
    <div className="w-full max-w-4xl">
      <OrderDetail transaction={serialized} dict={dict} />
    </div>
  );
}
