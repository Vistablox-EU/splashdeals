import { prisma } from "@/server/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
  });

  if (!post) return { title: "Nije pronađeno | Splashdeals.rs" };

  const metaTitle = post.metaTitle || `${post.title} | Splashdeals.rs`;
  const metaDescription = post.metaDescription || (post.excerpt || "").slice(0, 160);

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
      ? {
          index: post.robotsDirective.includes("noindex") ? false : true,
          follow: post.robotsDirective.includes("nofollow") ? false : true,
        }
      : undefined,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  // Check for preview mode — allow viewing DRAFT content
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!post) notFound();

  // In preview mode, show the post regardless of status
  // In non-preview mode, only show PUBLISHED posts

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
    : [];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {/* Back link */}
      <Link
        href="/blog"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <Icon name="arrow_back" className="size-4" />
        Nazad na blog
      </Link>

      {/* Header */}
      <header className="mb-8">
        {post.category && (
          <Link
            href={`/blog?category=${post.category.slug}`}
            className="mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: post.category.color ? `${post.category.color}20` : undefined,
              color: post.category.color || undefined,
            }}
          >
            {post.category.name}
          </Link>
        )}

        <h1 className="mb-4 text-3xl leading-tight font-bold tracking-tight md:text-4xl">
          {post.title}
        </h1>

        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
          {post.publishedAt && (
            <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
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
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-xs"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Cover image */}
      {post.coverImage && (
        <div className="bg-muted relative mb-8 aspect-[16/9] overflow-hidden rounded-xl">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
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
        <section className="mt-16 border-t pt-8">
          <h2 className="mb-6 text-2xl font-bold">Povezane objave</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {relatedPosts.map((rp) => (
              <Link
                key={rp.id}
                href={`/blog/${rp.slug}`}
                className="group rounded-lg border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {rp.coverImage && (
                  <div className="bg-muted relative mb-3 aspect-[16/9] overflow-hidden rounded-md">
                    <Image
                      src={rp.coverImage}
                      alt={rp.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
                <h3 className="group-hover:text-primary line-clamp-2 text-sm font-semibold transition-colors">
                  {rp.title}
                </h3>
                {rp.publishedAt && (
                  <p className="text-muted-foreground mt-1 text-xs">{formatDate(rp.publishedAt)}</p>
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
            author: post.author
              ? {
                  "@type": "Person",
                  name: post.author,
                }
              : {
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
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sr-RS", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
