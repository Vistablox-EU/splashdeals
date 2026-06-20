import { requireAdmin } from "@/server/lib/auth-guards"
import { prisma } from "@/server/lib/prisma"
import { PostsListClient } from "./_components/posts-list-client"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog objave | CMS | Splashdeals",
}

export default async function PostsPage() {
  await requireAdmin()

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true, slug: true, color: true } },
      _count: { select: { tags: true } },
    },
  })

  // Serialize Date -> ISO string for client
  const serialized = posts.map((post) => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: post.publishedAt?.toISOString() ?? null,
    readingTime: post.readingTime,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog objave</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upravljaj blog postovima, SEO meta podacima i kategorijama.
          </p>
        </div>
        <Link
          href="/admin/cms/posts/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Icon name="add" className="size-4" />
          Nova objava
        </Link>
      </div>

      <PostsListClient posts={serialized as unknown as Array<Record<string, unknown>>} />
    </div>
  )
}
