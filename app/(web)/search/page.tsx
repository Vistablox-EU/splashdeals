import { prisma } from "@/server/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FacilityRow {
  id: string;
  name: string;
  slug: string;
  city: string;
  rank: number;
}

interface ContentRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  rank: number;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const title = q?.trim() ? `Pretraga: ${q.trim()} | Splashdeals.rs` : "Pretraga | Splashdeals.rs";
  return {
    title,
    robots: { index: false, follow: true } as const,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  if (!q || q.trim().length < 2) {
    return <EmptyState />;
  }

  const query = q.trim();

  // Search facilities
  const facilities = await prisma.$queryRaw<FacilityRow[]>`
    SELECT id, name, slug, city,
           ts_rank(to_tsvector('serbian', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(city,'')), plainto_tsquery('serbian', ${query})) as rank
    FROM partners."Facility"
    WHERE to_tsvector('serbian', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(city,'')) @@ plainto_tsquery('serbian', ${query})
    ORDER BY rank DESC
    LIMIT 10
  `;

  // Search blog posts
  const posts = await prisma.$queryRaw<ContentRow[]>`
    SELECT id, title, slug,
           substring(content, 0, 300) as excerpt,
           ts_rank(to_tsvector('serbian', coalesce(title,'') || ' ' || coalesce(content,'')), plainto_tsquery('serbian', ${query})) as rank
    FROM marketing."BlogPost"
    WHERE to_tsvector('serbian', coalesce(title,'') || ' ' || coalesce(content,'')) @@ plainto_tsquery('serbian', ${query})
      AND status = 'PUBLISHED'
    ORDER BY rank DESC
    LIMIT 5
  `;

  // Search pages
  const pages = await prisma.$queryRaw<ContentRow[]>`
    SELECT id, title, slug,
           substring(content, 0, 300) as excerpt,
           ts_rank(to_tsvector('serbian', coalesce(title,'') || ' ' || coalesce(content,'')), plainto_tsquery('serbian', ${query})) as rank
    FROM marketing."Page"
    WHERE to_tsvector('serbian', coalesce(title,'') || ' ' || coalesce(content,'')) @@ plainto_tsquery('serbian', ${query})
      AND status = 'PUBLISHED'
    ORDER BY rank DESC
    LIMIT 5
  `;

  const totalResults = facilities.length + posts.length + pages.length;

  // Log zero-result queries
  if (totalResults === 0) {
    await prisma.searchLog.create({
      data: { query, results: 0 },
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          Rezultati pretrage za: <span className="text-primary">{query}</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Pronađeno {totalResults} rezultat{totalResults !== 1 ? "a" : ""}
        </p>
      </div>

      {totalResults === 0 ? (
        <div className="text-muted-foreground py-20 text-center">
          <p className="text-lg">Nema rezultata za: {query}.</p>
          <p className="mt-1 text-sm">Pokušajte druge ključne reči.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Facilities */}
          {facilities.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">Objekti</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {facilities.map((f) => (
                  <Link key={f.id} href={`/facility/${f.slug}`} className="block">
                    <Card className="hover:border-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <CardHeader>
                        <CardTitle className="text-base">{f.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                          <span className="text-primary">📍</span>
                          {f.city}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Blog posts */}
          {posts.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">Blog</h2>
              <div className="space-y-3">
                {posts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="block">
                    <Card className="hover:border-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <CardHeader>
                        <CardTitle className="text-base">{post.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {post.excerpt && (
                          <p className="text-muted-foreground line-clamp-2 text-sm">
                            {stripHtml(post.excerpt)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Static pages */}
          {pages.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">Stranice</h2>
              <div className="space-y-3">
                {pages.map((page) => (
                  <Link key={page.id} href={`/${page.slug}`} className="block">
                    <Card className="hover:border-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <CardHeader>
                        <CardTitle className="text-base">{page.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {page.excerpt && (
                          <p className="text-muted-foreground line-clamp-2 text-sm">
                            {stripHtml(page.excerpt)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-foreground mb-3 text-3xl font-bold tracking-tight">Pretraga</h1>
      <p className="text-muted-foreground">
        Unesite najmanje 2 karaktera da biste započeli pretragu objekata, blog postova i stranica.
      </p>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}
