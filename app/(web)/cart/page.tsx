import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { CartClient } from "./_components/CartClient";
import { JsonLd } from "@/components/SEO/JsonLd";

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
      <CartClient dict={dict} />
    </>
  );
}
