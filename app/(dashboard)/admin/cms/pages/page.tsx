import { requireAdmin } from "@/server/lib/auth-guards";
import { prisma } from "@/server/lib/prisma";
import { PagesListClient } from "./_components/pages-list-client";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Strane | CMS | Splashdeals",
};

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<{ stale?: string; status?: string }>;
}) {
  await requireAdmin();
  await connection();

  const params = await searchParams;
  const isStaleFilter = params.stale === "true";
  const isReviewFilter = params.status === "review";

  const staleThreshold = new Date();
  staleThreshold.setFullYear(staleThreshold.getFullYear() - 1);

  let pages;
  if (isReviewFilter) {
    pages = await prisma.page.findMany({
      where: { status: "REVIEW" },
      orderBy: { updatedAt: "desc" },
    });
  } else if (isStaleFilter) {
    pages = await prisma.page.findMany({
      where: {
        status: "PUBLISHED",
        updatedAt: { lt: staleThreshold },
        OR: [{ reviewedAt: null }, { reviewedAt: { lt: staleThreshold } }],
      },
      orderBy: { updatedAt: "desc" },
    });
  } else {
    pages = await prisma.page.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  const serialized = pages.map((page) => {
    const lastDate = page.reviewedAt
      ? new Date(Math.max(page.updatedAt.getTime(), page.reviewedAt.getTime()))
      : page.updatedAt;
    const isStale = page.status === "PUBLISHED" && lastDate < staleThreshold;

    return {
      ...page,
      createdAt: page.createdAt.toISOString(),
      updatedAt: page.updatedAt.toISOString(),
      publishedAt: page.publishedAt?.toISOString() ?? null,
      reviewedAt: page.reviewedAt?.toISOString() ?? null,
      isStale,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Strane</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Upravljaj statičkim stranama, landing page-ovima i SEO meta podacima.
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
        pages={serialized as unknown as Array<Record<string, unknown>>}
        isStaleFilter={isStaleFilter}
        isReviewFilter={isReviewFilter}
      />
    </div>
  );
}
