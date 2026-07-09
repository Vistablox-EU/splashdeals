import { requireAdmin } from "@/server/lib/auth-guards";
import { prisma } from "@/server/lib/prisma";
import { PostEditor } from "../_components/post-editor";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Nova objava | CMS | Splashdeals",
};

export default async function NewPostPage() {
  await requireAdmin();
  await connection();

  const categories = await prisma.blogCategory.findMany({
    orderBy: { displayOrder: "asc" },
  });
  const tags = await prisma.blogTag.findMany({
    orderBy: { name: "asc" },
  });

  const serializedCategories = categories.map((c) => ({
    ...c,
  })) as unknown as Array<Record<string, unknown>>;

  const serializedTags = tags.map((t) => ({
    ...t,
  })) as unknown as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/cms/posts"
          className="hover:bg-accent inline-flex items-center justify-center rounded-md border p-2 transition-colors"
        >
          <Icon name="arrow_back" className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nova blog objava</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kreiraj novu objavu sa bogatim sadržajem i SEO optimizacijom.
          </p>
        </div>
      </div>

      <PostEditor categories={serializedCategories} tags={serializedTags} />
    </div>
  );
}
