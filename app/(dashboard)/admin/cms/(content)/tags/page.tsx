import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { prisma } from "@/app/(server)/lib/prisma";
import { TagsManager } from "./_components/tags-manager";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Tagovi | CMS | Splashdeals",
};

export default async function TagsPage() {
  await requireAdmin();
  await connection();

  const tags = await prisma.blogTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  const serializedTags = tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    postCount: t._count.posts,
  }));

  return <TagsManager tags={serializedTags} />;
}
