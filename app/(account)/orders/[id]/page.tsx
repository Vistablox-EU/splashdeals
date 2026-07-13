import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";
import { OrderDetail } from "./_components/OrderDetail";

export const metadata: Metadata = {
  title: "Porudžbina | Splashdeals",
  robots: { index: false, follow: false },
};

export default async function OrderPage(props: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await props.params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/prijava");
  }

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

  return (
    <div className="container mx-auto min-h-screen max-w-4xl px-4 py-12">
      <OrderDetail transaction={serialized} />
    </div>
  );
}
