import { prisma } from "@/app/(server)/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";
import { sanitizeHtml } from "@/lib/sanitize";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: { authorPerson: true },
  });

  if (!post) return { title: "Nije pronađeno | Splashdeals.rs" };

  const metaTitle = post.metaTitle || `${post.title} | Splashdeals.rs`;
  const metaDescription = post.metaDescription || (post.excerpt || "").slice(0, 160);
  const siteUrl = "https://www.splashdeals.rs";
  const ogImage = post.ogImage || post.coverImage || undefined;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: { canonical: `${siteUrl}/blog/${post.slug}` },
    openGraph: {
      title: post.ogTitle || metaTitle,
      description: post.ogDescription || metaDescription,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    // #386 — Twitter Card tags
    twitter: {
      card: "summary_large_image",
      site: "@splashdeals",
      title: post.ogTitle || metaTitle,
      description: post.ogDescription || metaDescription,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: post.robotsDirective
      ? {
          index: post.robotsDirective.includes("noindex") ? false : true,
          follow: post.robotsDirective.includes("nofollow") ? false : true,
        }
      : undefined,
    other: {
      "twitter:card": "summary_large_image",
      "twitter:site": "@splashdeals",
    },
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
      authorPerson: true,
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

  // #389 — Auto-generated table of contents from heading tags
  const tocItems = extractToc(post.content);

  return (
    <article className="relative mx-auto max-w-3xl px-4 py-12">
      {/* Back link */}
      <Link
        href="/blog"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <Icon name="arrow_back" className="size-4" />
        Nazad na blog
      </Link>

      <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-8">
        {/* Main content */}
        <div>
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
                alt={post.coverImageAlt || post.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div
            id="blog-content"
            className="prose prose-lg dark:prose-invert toc-content max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
          />

          {/* #384 — Author card */}
          {post.authorPerson && <AuthorCard person={post.authorPerson} />}

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
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDate(rp.publishedAt)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* #389 — Sticky TOC sidebar */}
        {tocItems.length > 2 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <nav className="border-muted max-h-[calc(100vh-8rem)] overflow-y-auto border-l pl-4">
                <h3 className="text-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                  Sadržaj
                </h3>
                <ul className="space-y-1.5">
                  {tocItems.map((item, i) => (
                    <li key={i}>
                      <a
                        href={`#${item.id}`}
                        className={`text-muted-foreground hover:text-foreground block text-sm transition-colors ${
                          item.level === 3 ? "pl-3 text-xs" : ""
                        }`}
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>
        )}
      </div>

      {/* JSON-LD — Article schema + Person schema */}
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
            author: post.authorPerson
              ? {
                  "@type": "Person",
                  name: post.authorPerson.name,
                  image: post.authorPerson.photo || undefined,
                  url: post.authorPerson.twitterUrl || undefined,
                  description: post.authorPerson.bio || undefined,
                }
              : post.author
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

// #384 — Author card component
function AuthorCard({
  person,
}: {
  person: {
    name: string;
    photo: string | null;
    bio: string | null;
    twitterUrl: string | null;
    facebookUrl: string | null;
    linkedinUrl: string | null;
    instagramUrl: string | null;
  };
}) {
  return (
    <div className="bg-muted/30 mt-12 flex items-start gap-4 rounded-xl border p-6">
      {person.photo ? (
        <Image
          src={person.photo}
          alt={person.name}
          width={64}
          height={64}
          className="size-16 rounded-full object-cover"
        />
      ) : (
        <div className="bg-muted flex size-16 items-center justify-center rounded-full">
          <Icon name="person" className="text-muted-foreground size-8" />
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm font-semibold">{person.name}</p>
        {person.bio && <p className="text-muted-foreground mt-1 text-sm">{person.bio}</p>}
        {/* Social links */}
        {(person.twitterUrl || person.facebookUrl || person.linkedinUrl || person.instagramUrl) && (
          <div className="mt-2 flex gap-3">
            {person.twitterUrl && (
              <a
                href={person.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" className="size-4" />
              </a>
            )}
            {person.facebookUrl && (
              <a
                href={person.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="facebook" className="size-4" />
              </a>
            )}
            {person.linkedinUrl && (
              <a
                href={person.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="linkedin" className="size-4" />
              </a>
            )}
            {person.instagramUrl && (
              <a
                href={person.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="instagram" className="size-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// #389 — Extract TOC items from HTML content
interface TocItem {
  id: string;
  text: string;
  level: number;
}

function extractToc(html: string): TocItem[] {
  if (!html) return [];
  const items: TocItem[] = [];
  const headingRegex = /<h([23])(?:\s[^>]*)?>(.*?)<\/h[23]>/gi;
  let match: RegExpExecArray | null;

  // First pass: collect headings with their IDs if they exist
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const innerHtml = match[2];
    const text = innerHtml.replace(/<[^>]*>/g, "").trim();
    if (!text) continue;

    // Try to extract existing id from the tag
    const idMatch = match[0].match(/id\s*=\s*["']([^"']+)["']/);
    const id = idMatch ? idMatch[1] : slugifyHeading(text);

    items.push({ id, text, level });
  }

  return items;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sr-RS", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
