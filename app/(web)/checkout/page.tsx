import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Naplata | Splashdeals",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

/**
 * The cart page is the single checkout review and initiation surface.
 * It reads the authenticated server cart and starts the exact-cart reservation.
 */
export default async function CheckoutPage() {
  redirect("/cart");
}
