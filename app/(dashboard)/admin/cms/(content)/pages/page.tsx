import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { PagesListClient } from "./_components/pages-list-client";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { connection } from "next/server";
import { loadCmsPages, type PagesListFilter } from "@/app/(dashboard)/admin/cms/_data/cms-loaders";

export const metadata: Metadata = {
  title: "Strane | CMS | Splashdeals",
};

function resolveFilter(params: { stale?: string; status?: string }): PagesListFilter {
  if (params.status === "review") return "review";
  if (params.stale === "true") return "stale";
  return "all";
}

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<{ stale?: string; status?: string }>;
}) {
  await requireAdmin();
  await connection();

  const params = await searchParams;
  const filter = resolveFilter(params);
  const pages = await loadCmsPages(filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Strane</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Statičke strane i landing page-ovi. Objavljene strane se serviraju na /{"{slug}"}.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cms/pages/new">
            <Icon name="add" className="size-4" />
            Nova strana
          </Link>
        </Button>
      </div>

      <PagesListClient
        pages={pages as unknown as Array<Record<string, unknown>>}
        isStaleFilter={filter === "stale"}
        isReviewFilter={filter === "review"}
      />
    </div>
  );
}
