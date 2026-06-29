import { getNavigationMenus } from "@/server/lib/data/navigation"

export async function NavigationStructuredData() {
  const menus = await getNavigationMenus()

  if (menus.length === 0) return null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  // Build SiteNavigationElement items
  const navItems = menus.flatMap((menu) => {
    const items = menu.sections.flatMap((section) =>
      section.items.map((item) => ({
        name: item.label,
        url: item.href || `${siteUrl}/`,
        description: item.desc || undefined,
      }))
    )

    return [
      {
        name: menu.label,
        url: `${siteUrl}/`,
        children: items,
      },
    ]
  })

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SiteNavigationElement",
        "@id": `${siteUrl}/#navigation`,
        name: "Glavna navigacija",
        hasPart: navItems.map((item) => ({
          "@type": "SiteNavigationElement",
          name: item.name,
          url: item.url,
          ...(item.children.length > 0 && {
            hasPart: item.children.map((child: { name: string; url: string; description?: string }) => ({
              "@type": "SiteNavigationElement",
              name: child.name,
              url: child.url,
              ...(child.description && { description: child.description }),
            })),
          }),
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Početna",
            item: siteUrl,
          },
          ...navItems.map((item, index) => ({
            "@type": "ListItem",
            position: index + 2,
            name: item.name,
            item: `${siteUrl}/#${item.name.toLowerCase().replace(/\s+/g, "-")}`,
          })),
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Splashdeals",
        description: "Akva parkovi, bazeni, wellness i spa u Srbiji - najbolje ponude na jednom mestu.",
        inLanguage: "sr",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2),
      }}
    />
  )
}
