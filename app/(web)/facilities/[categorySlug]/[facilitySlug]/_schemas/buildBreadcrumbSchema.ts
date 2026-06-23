import { FacilitySchemaInput, SITE_URL } from "./types";

export function buildBreadcrumbSchema(facility: FacilitySchemaInput, facilitySlug: string, categorySlug: string, categoryLabel: string) {
  // Normalize category slug: "Waterpark" → "waterpark", "Swimming Pool" → "swimming-pool"
  const normalizedCategorySlug = categorySlug.toLowerCase().replace(/\s+/g, '-');
  
  return {
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}/${facilitySlug}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryLabel,
        item: `${SITE_URL}/${normalizedCategorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: facility.name,
        item: `${SITE_URL}/${facilitySlug}`,
      },
    ],
  };
}
