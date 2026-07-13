import { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDictionary } from "@/lib/dictionaries";
import { prisma } from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { JsonLd } from "@/components/SEO/JsonLd";
import { CheckoutForm } from "./_components/CheckoutForm";
import type { CartItem } from "@/lib/types/cart";

export const metadata: Metadata = {
  title: "Naplata | Splashdeals",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default async function CheckoutPage() {
  await connection();

  const dict = await getDictionary();

  // Require authentication
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/prijava");
  }

  // Read cart from server
  const cartSession = await prisma.cartSession.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  if (!cartSession || !Array.isArray(cartSession.items) || cartSession.items.length === 0) {
    redirect("/cart");
  }

  // Re-validate prices against DB
  const items = cartSession.items as unknown as CartItem[];
  const validatedItems: CartItem[] = [];
  let needsUpdate = false;

  for (const item of items) {
    const ticketPrice = await prisma.ticketPrice.findUnique({
      where: { id: item.ticketId },
      include: {
        ticketType: {
          include: {
            category: { include: { facility: true } },
          },
        },
      },
    });

    if (
      !ticketPrice ||
      !ticketPrice.isActive ||
      ticketPrice.ticketType.category.facility.status !== "ACTIVE"
    ) {
      continue;
    }

    const currentPrice = Number(ticketPrice.price);
    if (currentPrice !== item.price) {
      needsUpdate = true;
      validatedItems.push({ ...item, price: currentPrice });
    } else {
      validatedItems.push(item);
    }
  }

  if (validatedItems.length === 0) {
    redirect("/cart");
  }

  // Persist any price changes
  if (needsUpdate) {
    await prisma.cartSession.update({
      where: { id: cartSession.id },
      data: { items: validatedItems as unknown as Prisma.InputJsonValue },
    });
  }

  const totalBeforeDiscount = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const _facilityId = validatedItems[0].facilityId;

  return (
    <>
      <JsonLd
        id="checkout-schema"
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Naplata | Splashdeals",
          description: "Završite kupovinu digitalnih ulaznica za akva parkove.",
        }}
      />
      <CheckoutForm
        initialItems={validatedItems}
        totalBeforeDiscount={totalBeforeDiscount}
        dict={dict}
      />
    </>
  );
}
