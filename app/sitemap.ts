import { MetadataRoute } from 'next';
import { prisma } from '@/server/lib/prisma';

export const revalidate = 3600; // Revalidate sitemap every hour

/**
 * 🌊 Dynamic Sitemap Generator
 * Indexes all public routes using the canonical prefix-free URL structure.
 * Legacy /facilities/* routes are NOT indexed here — they 301 redirect automatically
 * or return 410 Gone if permanently deleted.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.splashdeals.rs';

  // 1. Static Core Routes (canonical URLs only — no legacy /facilities)
  const staticRoutes = [
    '',
    '/how-it-works',
    '/terms',
    '/privacy',
    '/support',
    '/cookies',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];
  const staticLastMod = new Date();

  for (const route of staticRoutes) {
    sitemapEntries.push({
      url: `${baseUrl}${route}`,
      lastModified: staticLastMod,
      changeFrequency: route === '' ? 'daily' : 'weekly',
      priority: route === '' ? 1.0 : 0.7,
    });
  }

  // 2. Serbian Category Discovery Routes (canonical — prefix-free)
  const categories = [
    { slug: 'akva-parkovi', label: 'Akva Parkovi' },
    { slug: 'bazeni', label: 'Bazeni' },
    { slug: 'wellness-i-spa', label: 'Wellness i Spa' },
  ];

  for (const cat of categories) {
    sitemapEntries.push({
      url: `${baseUrl}/${cat.slug}`,
      lastModified: staticLastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }


  // 4. Dynamic Facility Detail Routes (canonical — short URL: /[facilitySlug])
  try {
    const facilities = await prisma.facility.findMany({
      where: { status: 'ACTIVE' },
      select: {
        slug: true,
        name: true,
        description: true,
        updatedAt: true,
        media: {
          select: { url: true, type: true },
          orderBy: { order: 'asc' },
        }
      },
    });

    for (const facility of facilities) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const photos = facility.media.filter((m: any) => m.type === 'PHOTO').map((m: any) => m.url).slice(0, 5);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const videos = facility.media.filter((m: any) => m.type === 'VIDEO').map((m: any) => m.url).slice(0, 1);

      sitemapEntries.push({
        url: `${baseUrl}/${facility.slug}`,
        lastModified: facility.updatedAt,
        changeFrequency: 'daily',
        priority: 0.95,
        images: photos,
        // Only include video entries when we have a thumbnail (empty thumbnail_loc = XML error = sitemap rejected)
        videos: videos.length > 0 && photos[0]
          ? videos.map((v: string) => ({
              title: facility.name,
              thumbnail_loc: photos[0],
              description: facility.description || '',
              content_loc: v,
            }))
          : undefined,
      });
    }
  } catch (error) {
    console.error('Sitemap Error: Could not fetch facilities', error);
  }

  // 5. Blog Posts
  try {
    const blogPosts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true, publishedAt: true, coverImage: true, title: true, excerpt: true },
      orderBy: { publishedAt: 'desc' },
    });

    // Blog index page
    sitemapEntries.push({
      url: `${baseUrl}/blog`,
      lastModified: blogPosts[0]?.updatedAt || staticLastMod,
      changeFrequency: 'daily',
      priority: 0.8,
    });

    for (const post of blogPosts) {
      sitemapEntries.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
        images: post.coverImage ? [post.coverImage] : undefined,
      });
    }
  } catch (error) {
    console.error('Sitemap Error: Could not fetch blog posts', error);
  }

  return sitemapEntries;
}
