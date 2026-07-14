import { MetadataRoute } from "next";
import { prisma } from "@/app/(server)/lib/prisma";
import { getAllSlugs } from "@/lib/routing/categories";

export const revalidate = 3600;

const LOCALES = ["sr", "en"] as const;
const DEFAULT_LOCALE = "sr";
const BASE_URL = "https://www.splashdeals.rs";

/**
 * Build hreflang alternates for a given path.
 * The Serbian (default) locale uses the bare URL, English uses /en/ prefix.
 */
function alternatesFor(path: string): Record<string, string> {
  const clean = path.replace(/^\//, "");
  const sr = `${BASE_URL}/${clean}`.replace(/\/$/, "");
  const en = `${BASE_URL}/en/${clean}`.replace(/\/$/, "");
  return {
    sr,
    en,
    "x-default": sr,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/how-it-works", "/terms", "/privacy", "/support", "/cookies"];
  const sitemapEntries: MetadataRoute.Sitemap = [];
  const staticLastMod = new Date();

  // ── Static core routes (per locale) ─────────────────────────────────
  for (const route of staticRoutes) {
    // Serbian (canonical — bare path)
    sitemapEntries.push({
      url: `${BASE_URL}${route}`,
      lastModified: staticLastMod,
      changeFrequency: route === "" ? "daily" : "weekly",
      priority: route === "" ? 1.0 : 0.7,
      alternates: { languages: alternatesFor(route) },
    });
  }

  // ── Category Discovery Routes (per locale) ──────────────────────────
  for (const slug of getAllSlugs()) {
    sitemapEntries.push({
      url: `${BASE_URL}/${slug}`,
      lastModified: staticLastMod,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: alternatesFor(`/${slug}`) },
    });
  }

  // ── Dynamic Facility Detail Routes (per locale) ─────────────────────
  try {
    const facilities = await prisma.facility.findMany({
      where: { status: "ACTIVE" },
      select: {
        slug: true,
        updatedAt: true,
        media: {
          select: { url: true, type: true },
          orderBy: { order: "asc" },
        },
      },
    });

    for (const facility of facilities) {
      const photos = facility.media
        .filter((m) => m.type === "PHOTO")
        .map((m) => m.url)
        .slice(0, 5);

      sitemapEntries.push({
        url: `${BASE_URL}/${facility.slug}`,
        lastModified: facility.updatedAt,
        changeFrequency: "daily",
        priority: 0.95,
        alternates: { languages: alternatesFor(`/${facility.slug}`) },
        images: photos,
      });
    }
  } catch (error) {
    console.error("Sitemap Error: Could not fetch facilities", error);
  }

  // ── Blog Posts (per locale) ─────────────────────────────────────────
  try {
    const blogPosts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true, coverImage: true },
      orderBy: { publishedAt: "desc" },
    });

    sitemapEntries.push({
      url: `${BASE_URL}/blog`,
      lastModified: blogPosts[0]?.updatedAt || staticLastMod,
      changeFrequency: "daily",
      priority: 0.8,
      alternates: { languages: alternatesFor("/blog") },
    });

    for (const post of blogPosts) {
      sitemapEntries.push({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages: alternatesFor(`/blog/${post.slug}`) },
        images: post.coverImage ? [post.coverImage] : undefined,
      });
    }
  } catch (error) {
    console.error("Sitemap Error: Could not fetch blog posts", error);
  }

  // ── Navigation Menu Items (per locale) ──────────────────────────────
  try {
    const items = await prisma.navigationMenuItem.findMany({
      where: {
        isActive: true,
        href: { not: null, notIn: ["#", ""] },
        section: { menu: { isActive: true } },
      },
      select: { href: true },
    });

    const seen = new Set(sitemapEntries.map((e) => e.url));
    for (const item of items) {
      const href = item.href as string;
      if (href.startsWith("/") && !seen.has(`${BASE_URL}${href}`)) {
        seen.add(`${BASE_URL}${href}`);
        sitemapEntries.push({
          url: `${BASE_URL}${href}`,
          lastModified: staticLastMod,
          changeFrequency: "weekly",
          priority: 0.65,
          alternates: { languages: alternatesFor(href) },
        });
      }
    }
  } catch (error) {
    console.error("Sitemap Error: Could not fetch navigation items", error);
  }

  return sitemapEntries;
}
