import { prisma } from "@/app/(server)/lib/prisma";
import { getDictionary } from "@/lib/dictionaries";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Splashdeals.rs",
  description:
    "Najnovije vesti, saveti i informacije o akva parkovima, bazenima i wellness centrima u Srbiji.",
  alternates: { canonical: "https://www.splashdeals.rs/blog" },
  other: {
    "link:alternate": "https://www.splashdeals.rs/blog/feed.xml",
  },
  openGraph: {
    title: "Blog | Splashdeals.rs",
    description: "Najnovije vesti o akva parkovima i bazenima u Srbiji.",
    type: "website",
  },
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const dict = await getDictionary();
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const perPage = 12;

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
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight">{dict.blog.heading || "Blog"}</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          {dict.blog.description ||
            "Saveti, vodiči i novosti iz sveta akva parkova, bazena i wellness centara u Srbiji."}
        </p>
      </div>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <div className="text-muted-foreground py-20 text-center">
          <Icon name="article" className="mx-auto mb-4 size-12 opacity-50" />
          <p className="text-lg">{dict.blog.no_posts || "Još uvek nema objava."}</p>
          <p className="mt-1 text-sm">{dict.blog.come_back || "Vrati se uskoro!"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-card overflow-hidden rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {/* Cover image */}
              <div className="bg-muted relative aspect-[16/9] overflow-hidden">
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="text-muted-foreground/30 flex h-full w-full items-center justify-center">
                    <Icon name="image" className="size-12" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2 p-5">
                {/* Category */}
                {post.category && (
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: post.category.color ? `${post.category.color}20` : undefined,
                      color: post.category.color || undefined,
                    }}
                  >
                    {post.category.name}
                  </span>
                )}

                {/* Title */}
                <h2 className="group-hover:text-primary line-clamp-2 text-lg leading-tight font-semibold transition-colors">
                  {post.title}
                </h2>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-muted-foreground line-clamp-2 text-sm">{post.excerpt}</p>
                )}

                {/* Meta */}
                <div className="text-muted-foreground flex items-center gap-3 pt-1 text-xs">
                  {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
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
        <nav className="mt-12 flex items-center justify-center gap-3" aria-label="Blog pagination">
          {currentPage > 1 && (
            <Link
              href={`/blog?page=${currentPage - 1}`}
              className="hover:bg-accent inline-flex min-h-[44px] items-center gap-1 rounded-md border px-3 py-2 text-sm transition-colors"
            >
              <Icon name="chevron_left" className="size-4" />
              {dict.blog.previous || "Prethodna"}
            </Link>
          )}
          <span className="text-muted-foreground px-3 text-sm">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/blog?page=${currentPage + 1}`}
              className="hover:bg-accent inline-flex min-h-[44px] items-center gap-1 rounded-md border px-3 py-2 text-sm transition-colors"
            >
              {dict.blog.next || "Sledeća"}
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
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sr-RS", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
