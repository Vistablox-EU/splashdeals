import { redirect } from "next/navigation"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CMS | Splashdeals Admin",
  description: "Upravljajte blog postovima, stranicama i sadržajem.",
}

export default function CMSPage() {
  redirect("/admin/cms/posts")
}
