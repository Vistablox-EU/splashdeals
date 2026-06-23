import { FacilitySchemaInput, SITE_URL } from "./types";
import { buildAttractionSchema } from "./buildAttractionSchema";
import { buildBusinessSchema } from "./buildBusinessSchema";
import { buildProductSchema } from "./buildProductSchema";
import { buildVideoSchema } from "./buildVideoSchema";
import { buildBreadcrumbSchema } from "./buildBreadcrumbSchema";

// ── Types ────────────────────────────────────────────────────────

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

// ── Main builder ─────────────────────────────────────────────────

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

  // ── Dynamic Wikidata entity mapping for GEO ────────────────────
  const categoryLower = facility.category?.toLowerCase() ?? "";
  const additionalType =
    categoryLower === "waterpark"
      ? "https://www.wikidata.org/wiki/Q740331"
      : categoryLower === "swimming-pool"
        ? "https://www.wikidata.org/wiki/Q64528"
        : "https://www.wikidata.org/wiki/Q11947";

  // ── AggregateOffer + per-offer pricing ─────────────────────────
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

  // ── Video thumbnail fallback ───────────────────────────────────
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

  // ── Operating hours mapping ─────────────────────────────────────
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

  // ── @graph assembly ─────────────────────────────────────────────
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
