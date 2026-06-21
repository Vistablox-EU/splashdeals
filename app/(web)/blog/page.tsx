import { prisma } from "@/server/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { Icon } from "@/components/ui/Icon"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog | Splashdeals.rs",
  description: "Najnovije vesti, saveti i informacije o akva parkovima, bazenima i wellness centrima u Srbiji.",
  alternates: { canonical: "https://www.splashdeals.rs/blog" },
  other: {
    "link:alternate": "https://www.splashdeals.rs/blog/feed.xml",
  },
  openGraph: {
    title: "Blog | Splashdeals.rs",
    description: "Najnovije vesti o akva parkovima i bazenima u Srbiji.",
    type: "website",
  },
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10) || 1)
  const perPage = 12

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      skip: (currentPage - 1) * perPage,
      take: perPage,
      include: {
        category: { select: { name: true, slug: true, color: true } },
        _count: { select: { tags: true } },
      },
    }),
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Blog</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Saveti, vodiči i novosti iz sveta akva parkova, bazena i wellness centara u Srbiji.
        </p>
      </div>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Icon name="article" className="size-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Još uvek nema objava.</p>
          <p className="text-sm mt-1">Vrati se uskoro!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group rounded-xl border bg-card hover:shadow-lg transition-all hover:-translate-y-0.5 overflow-hidden"
            >
              {/* Cover image */}
              <div className="relative aspect-[16/9] bg-muted overflow-hidden">
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <Icon name="image" className="size-12" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 space-y-2">
                {/* Category */}
                {post.category && (
                  <span
                    className="inline-block text-xs font-medium rounded-full px-2.5 py-0.5"
                    style={{
                      backgroundColor: post.category.color ? `${post.category.color}20` : undefined,
                      color: post.category.color || undefined,
                    }}
                  >
                    {post.category.name}
                  </span>
                )}

                {/* Title */}
                <h2 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h2>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  {post.publishedAt && (
                    <span>{formatDate(post.publishedAt)}</span>
                  )}
                  {post.readingTime && (
                    <span className="flex items-center gap-1">
                      <Icon name="schedule" className="size-3" />
                      {post.readingTime} min
                    </span>
                  )}
                  {post._count.tags > 0 && (
                    <span className="flex items-center gap-1">
                      <Icon name="sell" className="size-3" />
                      {post._count.tags}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex justify-center items-center gap-2 mt-12" aria-label="Blog pagination">
          {currentPage > 1 && (
            <Link
              href={`/blog?page=${currentPage - 1}`}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <Icon name="chevron_left" className="size-4" />
              Prethodna
            </Link>
          )}
          <span className="text-sm text-muted-foreground px-3">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/blog?page=${currentPage + 1}`}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              Sledeća
              <Icon name="chevron_right" className="size-4" />
            </Link>
          )}
        </nav>
      )}

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Splashdeals.rs Blog",
            url: "https://www.splashdeals.rs/blog",
            description: "Saveti, vodiči i novosti iz sveta akva parkova i bazena u Srbiji.",
          }),
        }}
      />
    </div>
  )
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sr-RS", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}
