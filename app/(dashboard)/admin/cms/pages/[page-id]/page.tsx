import { requireAdmin } from "@/server/lib/auth-guards"
import { prisma } from "@/server/lib/prisma"
import { notFound } from "next/navigation"
import { PageEditor } from "../_components/page-editor"
import { Icon } from "@/components/ui/Icon"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Izmeni stranu | CMS | Splashdeals",
}

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ "page-id": string }>
}) {
  await requireAdmin()
  const { "page-id": pageId } = await params

  const page = await prisma.page.findUnique({ where: { id: pageId } })
  if (!page) notFound()

  const pageData = {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    publishedAt: page.publishedAt?.toISOString() ?? null,
  }

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
          <h1 className="text-2xl font-semibold tracking-tight">Izmeni stranu</h1>
          <p className="text-sm text-muted-foreground mt-1">Uredi {pageData.title}</p>
        </div>
      </div>
      <PageEditor page={pageData as unknown as Record<string, unknown>} />
    </div>
  )
}
