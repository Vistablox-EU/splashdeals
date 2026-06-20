import { prisma } from "@/server/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import type { Metadata } from "next"

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
  })

  if (!post) return { title: "Nije pronađeno | Splashdeals.rs" }

  const metaTitle = post.metaTitle || `${post.title} | Splashdeals.rs`
  const metaDescription = post.metaDescription || (post.excerpt || "").slice(0, 160)

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: { canonical: `https://www.splashdeals.rs/blog/${post.slug}` },
    openGraph: {
      title: post.ogTitle || metaTitle,
      description: post.ogDescription || metaDescription,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: post.ogImage ? [{ url: post.ogImage, width: 1200, height: 630 }] : undefined,
    },
    robots: post.robotsDirective
      ? { index: post.robotsDirective.includes("noindex") ? false : true, follow: post.robotsDirective.includes("nofollow") ? false : true }
      : undefined,
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params

  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  })

  if (!post) notFound()

  // Related posts by same category
  const relatedPosts = post.categoryId
    ? await prisma.blogPost.findMany({
        where: {
          status: "PUBLISHED",
          categoryId: post.categoryId,
          id: { not: post.id },
        },
        take: 3,
        orderBy: { publishedAt: "desc" },
        select: { id: true, title: true, slug: true, coverImage: true, publishedAt: true },
      })
    : []

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <Icon name="arrow_back" className="size-4" />
        Nazad na blog
      </Link>

      {/* Header */}
      <header className="mb-8">
        {post.category && (
          <Link
            href={`/blog?category=${post.category.slug}`}
            className="inline-block text-xs font-medium rounded-full px-2.5 py-0.5 mb-3"
            style={{
              backgroundColor: post.category.color ? `${post.category.color}20` : undefined,
              color: post.category.color || undefined,
            }}
          >
            {post.category.name}
          </Link>
        )}

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {post.publishedAt && (
            <time dateTime={post.publishedAt.toISOString()}>
              {formatDate(post.publishedAt)}
            </time>
          )}
          {post.readingTime && (
            <span className="flex items-center gap-1">
              <Icon name="schedule" className="size-3.5" />
              {post.readingTime} min čitanja
            </span>
          )}
          {post.author && (
            <span className="flex items-center gap-1">
              <Icon name="person" className="size-3.5" />
              {post.author}
            </span>
          )}
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {post.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Cover image */}
      {post.coverImage && (
        <div className="aspect-[16/9] rounded-xl overflow-hidden mb-8 bg-muted">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-16 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6">Povezane objave</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedPosts.map((rp) => (
              <Link
                key={rp.id}
                href={`/blog/${rp.slug}`}
                className="group rounded-lg border p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                {rp.coverImage && (
                  <div className="aspect-[16/9] rounded-md overflow-hidden mb-3 bg-muted">
                    <img
                      src={rp.coverImage}
                      alt={rp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                  {rp.title}
                </h3>
                {rp.publishedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(rp.publishedAt)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* JSON-LD — Article schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt || post.metaDescription || undefined,
            image: post.coverImage || undefined,
            datePublished: post.publishedAt?.toISOString(),
            dateModified: post.updatedAt.toISOString(),
            author: post.author ? {
              "@type": "Person",
              name: post.author,
            } : {
              "@type": "Organization",
              name: "Splashdeals.rs",
            },
            publisher: {
              "@type": "Organization",
              name: "Splashdeals.rs",
              url: "https://www.splashdeals.rs",
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://www.splashdeals.rs/blog/${post.slug}`,
            },
          }),
        }}
      />
    </article>
  )
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sr-RS", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}
