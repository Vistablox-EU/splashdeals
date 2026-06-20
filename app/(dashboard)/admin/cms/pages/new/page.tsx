import { requireAdmin } from "@/server/lib/auth-guards"
import { PageEditor } from "../_components/page-editor"
import { Icon } from "@/components/ui/Icon"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Nova strana | CMS | Splashdeals",
}

export default async function NewPagePage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/cms/pages"
          className="inline-flex items-center justify-center rounded-md border p-2 hover:bg-accent transition-colors"
        >
          <Icon name="arrow_back" className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nova strana</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kreiraj novu statičku ili landing stranu.
          </p>
        </div>
      </div>
      <PageEditor />
    </div>
  )
}
