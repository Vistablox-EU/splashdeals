import { Metadata } from "next";
import { connection } from "next/server";
import { JsonLd } from "@/components/SEO/JsonLd";
import { redirect } from "next/navigation";

/**
 * 🌊 Checkout Page
 * Users must add items to cart first — direct access redirects to homepage.
 * Meta robots: noindex, nofollow (transactional page — never index).
 * Only ONE source of robots directives to prevent conflicts.
 */
export const metadata: Metadata = {
  title: "Naplata | Splashdeals",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default async function CheckoutPage() {
  await connection();

  // No items in cart — redirect to homepage
  // (In a real implementation, this would check cart state)
  redirect("/");

  return (
    <>
      <JsonLd
        id="checkout-schema"
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Naplata | Splashdeals",
          "description": "Završite kupovinu digitalnih ulaznica za akva parkove.",
        }}
      />
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Preusmeravanje...</p>
      </div>
    </>
  );
}
