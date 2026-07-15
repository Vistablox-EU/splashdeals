import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { prisma } from "@/app/(server)/lib/prisma";
import { PostsListClient, type PostRow } from "./_components/posts-list-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Blog objave | CMS | Splashdeals",
};

export default async function PostsPage({
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

  let posts;
  if (isReviewFilter) {
    posts = await prisma.blogPost.findMany({
      where: { status: "REVIEW" },
      orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
        _count: { select: { tags: true } },
      },
    });
  } else if (isStaleFilter) {
    posts = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        updatedAt: { lt: staleThreshold },
        OR: [{ reviewedAt: null }, { reviewedAt: { lt: staleThreshold } }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
        _count: { select: { tags: true } },
      },
    });
  } else {
    posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
        _count: { select: { tags: true } },
      },
    });
  }

  // Serialize Date -> ISO string for client + compute isStale
  const serialized = posts.map((post) => {
    const lastDate = post.reviewedAt
      ? new Date(Math.max(post.updatedAt.getTime(), post.reviewedAt.getTime()))
      : post.updatedAt;
    const isStale = post.status === "PUBLISHED" && lastDate < staleThreshold;

    return {
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      publishedAt: post.publishedAt?.toISOString() ?? null,
      reviewedAt: post.reviewedAt?.toISOString() ?? null,
      isStale,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog objave</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Upravljaj blog postovima, SEO meta podacima i kategorijama.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cms/posts/new">
            <Icon name="add" className="size-4" />
            Nova objava
          </Link>
        </Button>
      </div>

      <PostsListClient
        posts={serialized as PostRow[]}
        isStaleFilter={isStaleFilter}
        isReviewFilter={isReviewFilter}
      />
    </div>
  );
}
