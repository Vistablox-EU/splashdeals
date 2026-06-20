import { prisma } from "@/server/lib/prisma"

export const revalidate = 3600

export async function GET() {
  const baseUrl = "https://www.splashdeals.rs"

  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      publishedAt: true,
      updatedAt: true,
      author: true,
      category: { select: { name: true } },
    },
  })

  const items = posts
    .map(
      (post) => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ""}]]></description>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : ""}</pubDate>
      ${post.author ? `<author>${post.author}</author>` : ""}
      ${post.category ? `<category>${post.category.name}</category>` : ""}
    </item>`
    )
    .join("\n")

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Splashdeals.rs Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Saveti, vodiči i novosti iz sveta akva parkova, bazena i wellness centara u Srbiji.</description>
    <language>sr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  })
}
