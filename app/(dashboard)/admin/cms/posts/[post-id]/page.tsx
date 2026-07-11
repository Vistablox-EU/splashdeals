import { requireAdmin } from "@/server/lib/auth-guards";
import { prisma } from "@/server/lib/prisma";
import { notFound } from "next/navigation";
import { PostEditor } from "../_components/post-editor";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Izmeni objavu | CMS | Splashdeals",
};

export default async function EditPostPage({ params }: { params: Promise<{ "post-id": string }> }) {
  await requireAdmin();
  await connection();
  const { "post-id": postId } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    include: { tags: true },
  });

  if (!post) {
    notFound();
  }

  const categories = await prisma.blogCategory.findMany({
    orderBy: { displayOrder: "asc" },
  });
  const tags = await prisma.blogTag.findMany({
    orderBy: { name: "asc" },
  });

  const postData = {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: post.publishedAt?.toISOString() ?? null,
  };

  const postTagIds = post.tags.map((t) => t.tagId);

  const dict = await getDictionary();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/cms/posts"
          aria-label="Nazad na listu objava"
          className="hover:bg-accent inline-flex items-center justify-center rounded-md border p-2 transition-colors"
        >
          <Icon name="arrow_back" className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Izmeni objavu</h1>
          <p className="text-muted-foreground mt-1 text-sm">Uredi {postData.title}</p>
        </div>
      </div>

      <PostEditor
        post={postData as unknown as Record<string, unknown>}
        initialTagIds={postTagIds}
        categories={categories as unknown as Array<Record<string, unknown>>}
        tags={tags as unknown as Array<Record<string, unknown>>}
        dict={dict}
      />
    </div>
  );
}
