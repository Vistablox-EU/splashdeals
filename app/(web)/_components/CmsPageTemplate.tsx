import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/app/(server)/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";

const SITE_URL = "https://www.splashdeals.rs";

export async function getPublishedCmsPage(slug: string) {
  const now = new Date();
  return prisma.page.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [
        {
          OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
        },
      ],
    },
  });
}

export async function buildCmsPageMetadata(slug: string): Promise<Metadata> {
  const page = await getPublishedCmsPage(slug);
  if (!page) return { title: "Nije pronađeno | Splashdeals.rs" };

  const metaTitle = page.metaTitle || `${page.title} | Splashdeals.rs`;
  const metaDescription = page.metaDescription || (page.excerpt || "").slice(0, 160);
  const ogImage = page.ogImage || page.coverImage || undefined;
  const canonical = page.canonicalUrl || `${SITE_URL}/${page.slug}`;
  const robots =
    page.robotsDirective === "noindex"
      ? { index: false, follow: false }
      : page.robotsDirective === "nofollow"
        ? { index: true, follow: false }
        : undefined;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: { canonical },
    robots,
    openGraph: {
      title: page.ogTitle || metaTitle,
      description: page.ogDescription || metaDescription,
      type: "website",
      url: canonical,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      site: "@splashdeals",
      title: page.ogTitle || metaTitle,
      description: page.ogDescription || metaDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export async function CmsPageTemplate({ slug }: { slug: string }) {
  const page = await getPublishedCmsPage(slug);
  if (!page) notFound();

  const html = sanitizeHtml(page.content || "");

  return (
    <article className="relative mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{page.title}</h1>
        {page.excerpt ? <p className="text-muted-foreground text-lg">{page.excerpt}</p> : null}
        {page.coverImage ? (
          <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden rounded-xl">
            <Image
              src={page.coverImage}
              alt={page.title}
              fill
              className="object-cover"
              unoptimized
              priority
            />
          </div>
        ) : null}
      </header>
      <div
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
