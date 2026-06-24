// ── Shared types & constants ───────────────────────────────────────

export interface FacilitySchemaInput {
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  publicPhone?: string | null;
  streetName: string;
  streetNumber: string;
  city: string;
  postalCode: string;
  lat?: number | string | null;
  lng?: number | string | null;
  createdAt?: Date | string;
  media?: { 
    url: string; 
    type?: string; 
    purpose?: string; 
    duration?: string; 
    caption?: string | null; 
    createdAt?: Date;
    isHero?: boolean;
    isCardBackground?: boolean;
    thumbnailUrl?: string | null;
  }[];
}

export const catLabelMap: Record<string, string> = {
  "akva-parkovi": "Akva Parkovi",
  "bazeni": "Bazeni",
  "wellness-i-spa": "Wellness i Spa",
};

/** Canonical site URL — must be set via NEXT_PUBLIC_SITE_URL env var. */
export const SITE_URL: string = process.env.NEXT_PUBLIC_SITE_URL!;

// ── Schema: Attraction ─────────────────────────────────────────────

export function buildAttractionSchema(
  facility: FacilitySchemaInput,
  facilitySlug: string,
  operatingHours: Record<string, unknown>[]
) {
  const heroImage = facility.media?.[0]?.url || `${SITE_URL}/og-image.png`;
  return {
    "@type": ["AmusementPark", "TouristAttraction"],
    "@id": `${SITE_URL}/${facilitySlug}#attraction`,
    name: facility.name,
    description: facility.description?.slice(0, 300),
    url: `${SITE_URL}/${facilitySlug}`,
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

// ── Schema: Business ────────────────────────────────────────────────

export function buildBusinessSchema(
  facility: FacilitySchemaInput,
  facilitySlug: string,
  hasAggregateOffer: boolean
) {
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

// ── Schema: Product ────────────────────────────────────────────────

export function buildProductSchema(
  facility: FacilitySchemaInput,
  facilitySlug: string,
  aggregateOffer: Record<string, unknown> | null,
  ticketCount: number,
  additionalType: string
) {
  if (!aggregateOffer) return null;
  
  const heroImage = facility.media?.[0]?.url || `${SITE_URL}/og-image.png`;
  
  return {
    "@type": "Product",
    "@id": `${SITE_URL}/${facilitySlug}#product`,
    name: `${facility.name} - Digital Tickets`,
    description: `Kupi digitalne ulaznice za ${facility.name} na Splashdeals. Brza digitalna isporuka, podr\u0161ka za Apple & Google Wallet. ${ticketCount} vrsta ulaznica u ponudi.`,
    image: heroImage,
    sku: `SD-FAC-${facility.slug.toUpperCase()}`,
    mpn: `SD-MPN-${facility.slug.toUpperCase()}`,
    additionalType: additionalType,
    brand: {
      "@type": "Brand",
      name: facility.name,
    },
    offers: aggregateOffer,
    category: facility.category,
  };
}

// ── Schema: Video ──────────────────────────────────────────────────

export function buildVideoSchema(
  facility: FacilitySchemaInput,
  facilitySlug: string,
  heroMedia: Record<string, unknown> | null,
  videoThumbnail: string
) {
  if (heroMedia?.type !== "VIDEO") return null;
  if (!heroMedia?.duration) return null;

  return {
    "@type": "VideoObject",
    "@id": `${SITE_URL}/${facilitySlug}#video`,
    name: `${facility.name} - Promotional Video`,
    description: heroMedia.caption || `Promotional video for ${facility.name}`,
    contentUrl: heroMedia.url,
    thumbnailUrl: videoThumbnail,
    duration: heroMedia.duration,
    uploadDate: heroMedia.createdAt || facility.createdAt || undefined,
  };
}

// ── Schema: Breadcrumb ─────────────────────────────────────────────

export function buildBreadcrumbSchema(
  facility: FacilitySchemaInput,
  facilitySlug: string,
  categorySlug: string,
  categoryLabel: string
) {
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

// ── Schema: Facet (Main @graph Assembly) ────────────────────────────

export interface TierEntry {
  id: string;
  price: number;
  originalPrice?: number | null;
  label: string;
  isActive: boolean;
  minPeople?: number;
  maxPeople?: number | null;
  saleStart?: Date | string | null;
  saleEnd?: Date | string | null;
}

interface HoursEntry {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}

export interface BuildFacilitySchemaParams {
  facility: FacilitySchemaInput;
  facilitySlug: string;
  categorySlug: string;
  categoryLabel: string;
  allTiers: TierEntry[];
  heroMedia: Record<string, unknown> | null;
  ticketCount: number;
  currentYear: number;
  hours: HoursEntry[];
}

export function buildFacilitySchema(params: BuildFacilitySchemaParams) {
  const {
    facility,
    facilitySlug,
    categorySlug,
    categoryLabel,
    allTiers,
    heroMedia,
    ticketCount,
    currentYear,
    hours,
  } = params;

  const additionalType =
    categorySlug === "akva-parkovi"
      ? "https://www.wikidata.org/wiki/Q740331"
      : categorySlug === "bazeni"
        ? "https://www.wikidata.org/wiki/Q64528"
        : "https://www.wikidata.org/wiki/Q11947";

  const aggregateOffer =
    allTiers.length > 0
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "RSD",
          lowPrice: Math.min(...allTiers.map((t) => Number(t.price))),
          highPrice: Math.max(...allTiers.map((t) => Number(t.price))),
          offerCount: allTiers.length,
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: {
              "@type": "MonetaryAmount",
              value: 0,
              priceCurrency: "RSD",
            },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: {
                "@type": "QuantitativeValue",
                maxValue: 0,
                unitCode: "DAY",
              },
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "RS",
            returnPolicyCategory: "https://schema.org/NoReturns",
          },
          offers: allTiers.map((tier) => {
            const hasDiscount =
              tier.originalPrice != null &&
              Number(tier.originalPrice) > Number(tier.price);

            const priceSpecification = hasDiscount
              ? [
                  {
                    "@type": "UnitPriceSpecification",
                    priceType: "https://schema.org/ListPrice",
                    price: Number(tier.originalPrice),
                    priceCurrency: "RSD",
                    valueAddedTaxIncluded: true,
                  },
                  {
                    "@type": "UnitPriceSpecification",
                    priceType: "https://schema.org/SalePrice",
                    price: Number(tier.price),
                    priceCurrency: "RSD",
                    valueAddedTaxIncluded: true,
                  },
                ]
              : [
                  {
                    "@type": "UnitPriceSpecification",
                    priceType: "https://schema.org/ListPrice",
                    price: Number(tier.price),
                    priceCurrency: "RSD",
                    valueAddedTaxIncluded: true,
                  },
                ];

            const saleEndDate = tier.saleEnd
              ? new Date(tier.saleEnd)
              : null;
            const priceValidUntil =
              saleEndDate && !isNaN(saleEndDate.getTime())
                ? saleEndDate.toISOString().slice(0, 10)
                : `${currentYear}-12-31`;

            const saleStartDate = tier.saleStart
              ? new Date(tier.saleStart)
              : null;
            const availabilityStarts =
              saleStartDate && !isNaN(saleStartDate.getTime())
                ? saleStartDate.toISOString().slice(0, 10)
                : null;

            const availabilityEnds = (() => {
              const end = tier.saleEnd ? new Date(tier.saleEnd) : null;
              return end && !isNaN(end.getTime())
                ? end.toISOString().slice(0, 10)
                : null;
            })();

            return {
              "@type": "Offer",
              "@id": `${SITE_URL}/${facilitySlug}#ticket-${tier.id}`,
              name: tier.label,
              price: Number(tier.price),
              priceCurrency: "RSD",
              priceSpecification,
              priceValidUntil,
              availability: tier.isActive
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              url: `${SITE_URL}/${facilitySlug}#ticket-${tier.id}`,
              acceptedPaymentMethod: [
                {
                  "@type": "PaymentMethod",
                  "@id": "https://schema.org/CreditCard",
                },
                {
                  "@type": "PaymentMethod",
                  "@id": "https://schema.org/PaymentMethodTypeWallet",
                },
              ],
              ...(availabilityStarts ? { availabilityStarts } : {}),
              ...(availabilityEnds ? { availabilityEnds } : {}),
              ...(tier.minPeople || tier.maxPeople
                ? {
                    eligibleQuantity: {
                      "@type": "QuantitativeValue",
                      ...(tier.minPeople
                        ? { minValue: Number(tier.minPeople) }
                        : {}),
                      ...(tier.maxPeople
                        ? { maxValue: Number(tier.maxPeople) }
                        : {}),
                    },
                  }
                : {}),
              seller: {
                "@type": "Organization",
                name: "Splashdeals",
                url: SITE_URL,
              },
              provider: {
                "@type": "LocalBusiness",
                name: facility.name,
                ...(facility.media?.[0]?.url
                  ? { image: facility.media[0].url }
                  : {}),
                priceRange: "RSD",
                ...(facility.publicPhone
                  ? { telephone: facility.publicPhone }
                  : {}),
                address: {
                  "@type": "PostalAddress",
                  streetAddress: `${facility.streetName} ${facility.streetNumber}`,
                  addressLocality: facility.city,
                  postalCode: facility.postalCode,
                  addressCountry: "RS",
                },
              },
            };
          }),
        }
      : null;

  const videoThumbnailFallback =
    facility.media?.find((m) => m.type === "PHOTO" && m.isHero)
      ?.url ??
    facility.media?.find((m) => m.type === "PHOTO" && m.isCardBackground)
      ?.url ??
    facility.media?.find((m) => m.type === "PHOTO")
      ?.url ??
    "/og-image.png";

  const videoThumbnail: string =
    (heroMedia?.thumbnailUrl as string | undefined) ?? videoThumbnailFallback;

  const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ] as const;

  const operatingHours =
    hours?.map((h) => ({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: DAY_NAMES[h.dayOfWeek],
      opens: h.openTime,
      closes: h.closeTime,
    })) ?? [];

  return {
    "@context": "https://schema.org",
    "@graph": [
      buildAttractionSchema(facility, facilitySlug, operatingHours),
      buildBusinessSchema(facility, facilitySlug, !!aggregateOffer),
      buildProductSchema(
        facility,
        facilitySlug,
        aggregateOffer,
        ticketCount,
        additionalType,
      ),
      buildVideoSchema(facility, facilitySlug, heroMedia, videoThumbnail),
      buildBreadcrumbSchema(facility, facilitySlug, categorySlug, categoryLabel),
    ].filter(Boolean),
  };
}
