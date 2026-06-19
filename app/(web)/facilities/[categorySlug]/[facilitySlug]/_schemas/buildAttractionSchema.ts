import { FacilitySchemaInput } from "./types";

export function buildAttractionSchema(facility: FacilitySchemaInput, facilitySlug: string, operatingHours: any[]) {
  const heroImage = facility.media?.[0]?.url || `https://www.splashdeals.rs/og-image.png`;
  return {
    "@type": ["AmusementPark", "TouristAttraction"],
    "@id": `https://www.splashdeals.rs/${facilitySlug}#attraction`,
    name: facility.name,
    description: facility.description?.slice(0, 300),
    url: `https://www.splashdeals.rs/${facilitySlug}`,
    image: heroImage,
    priceRange: "RSD",
    ...(facility.publicPhone ? { telephone: facility.publicPhone } : {}),
    isAccessibleForFree: false,
    publicAccess: true,
    availableLanguage: ["sr"],
    address: {
      "@type": "PostalAddress",
      streetAddress: `${facility.streetName} ${facility.streetNumber}`,
      addressLocality: facility.city,
      postalCode: facility.postalCode,
      addressCountry: "RS",
    },
    ...(facility.lat && facility.lng ? {
      geo: {
        "@type": "GeoCoordinates",
        latitude: Number(facility.lat),
        longitude: Number(facility.lng),
      }
    } : {}),
    ...(operatingHours.length > 0 ? {
      openingHoursSpecification: operatingHours
    } : {}),
  };
}
