import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { CartClient } from "./_components/CartClient";
import { JsonLd } from "@/components/SEO/JsonLd";
import { prisma } from "@/server/lib/prisma";
import { auth } from "@/server/lib/auth";
import { headers } from "next/headers";

import { connection } from "next/server";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();

  return {
    title: dict.cart?.title || "Vaša Korpa | Splashdeals",
    description: dict.cart?.description || "Pregledajte vaše izabrane ulaznice za akva parkove.",
    robots: { index: false, follow: false },
    alternates: { canonical: null },
    openGraph: {
      title: dict.cart?.title || "Vaša Korpa | Splashdeals",
      description: dict.cart?.description || "Pregledajte vaše izabrane ulaznice za akva parkove.",
      images: ["/og-image.png"],
      locale: "sr_RS",
      type: "website",
    },
  };
}

export default async function CartPage() {
  await connection();

  const dict = await getDictionary();

  // 🚩 Phase 2: Server-first cart — hydrate Zustand from CartSession
  let initialCart = null;
  if (process.env.NEXT_PUBLIC_CART_V2) {
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user) {
        const cartSession = await prisma.cartSession.findFirst({
          where: { userId: session.user.id },
          orderBy: { updatedAt: "desc" },
        });
        if (cartSession && Array.isArray(cartSession.items) && cartSession.items.length > 0) {
          initialCart = JSON.parse(JSON.stringify(cartSession.items));
        }
      }
    } catch {
      // Silently fall back to localStorage on error
    }
  }

  return (
    <>
      <JsonLd
        id="cart-schema"
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Korpa | Splashdeals",
          description: "Pregledajte karte za akva parkove pre plaćanja.",
        }}
      />
      <CartClient dict={dict} initialCart={initialCart} />
    </>
  );
}
