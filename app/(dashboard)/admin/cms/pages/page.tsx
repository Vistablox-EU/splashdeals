import { requireAdmin } from "@/server/lib/auth-guards";
import { prisma } from "@/server/lib/prisma";
import { PagesListClient } from "./_components/pages-list-client";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Strane | CMS | Splashdeals",
};

export default async function PagesPage() {
  await requireAdmin();
  await connection();

  const pages = await prisma.page.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = pages.map((page) => ({
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    publishedAt: page.publishedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Strane</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Upravljaj statičkim stranama, landing page-ovima i SEO meta podacima.
          </p>
        </div>
        <Link
          href="/admin/cms/pages/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          <Icon name="add" className="size-4" />
          Nova strana
        </Link>
      </div>

      <PagesListClient pages={serialized as unknown as Array<Record<string, unknown>>} />
    </div>
  );
}
