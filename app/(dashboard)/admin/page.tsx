import { redirect } from "next/navigation"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin | Splashdeals",
  description: "Splashdeals admin panel — upravljajte objektima, cenama i sadržajem.",
}

export default function AdminPage() {
  redirect("/admin/dashboard")
}
