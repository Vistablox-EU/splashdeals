import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { prisma } from "@/app/(server)/lib/prisma";
import { notFound } from "next/navigation";
import { PageEditor } from "../_components/page-editor";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/dictionaries";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Izmeni stranu | CMS | Splashdeals",
};

export default async function EditPagePage({ params }: { params: Promise<{ "page-id": string }> }) {
  await requireAdmin();
  await connection();
  const { "page-id": pageId } = await params;

  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) notFound();

  const pageData = {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    publishedAt: page.publishedAt?.toISOString() ?? null,
  };

  const dict = await getDictionary();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild aria-label="Nazad na listu strana">
          <Link href="/admin/cms/pages">
            <Icon name="arrow_back" className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Izmeni stranu</h1>
          <p className="text-muted-foreground mt-1 text-sm">Uredi {pageData.title}</p>
        </div>
      </div>
      <PageEditor page={pageData as unknown as Record<string, unknown>} dict={dict} />
    </div>
  );
}
