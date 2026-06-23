import { FacilitySchemaInput, SITE_URL } from "./types";

export function buildBusinessSchema(facility: FacilitySchemaInput, facilitySlug: string, hasAggregateOffer: boolean) {
  const heroImage = facility.media?.[0]?.url || `${SITE_URL}/og-image.png`;
  return {
    "@type": "EntertainmentBusiness",
    "@id": `${SITE_URL}/${facilitySlug}#business`,
    name: facility.name,
    url: `${SITE_URL}/${facilitySlug}`,
    image: heroImage,
    priceRange: hasAggregateOffer ? "RSD" : undefined,
    ...(facility.publicPhone ? { telephone: facility.publicPhone } : {}),
    sameAs: [
      "https://www.instagram.com/splashdeals",
      "https://www.facebook.com/splashdeals.rs/",
      "https://x.com/splashdeals"
    ].filter(Boolean),
    address: {
      "@type": "PostalAddress",
      streetAddress: `${facility.streetName} ${facility.streetNumber}`,
      addressLocality: facility.city,
      postalCode: facility.postalCode,
      addressCountry: "RS",
    },
    containsPlace: {
      "@id": `${SITE_URL}/${facilitySlug}#attraction`
    },
  };
}
