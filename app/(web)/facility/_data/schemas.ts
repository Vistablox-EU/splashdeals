// ── Shared types & constants ───────────────────────────────────────

import { slugToName, dbValueToSlug } from "@/lib/routing/categories";
import {
  absoluteUrl,
  collectPhotoUrls,
  extractSocialUrls,
  isEntryTicketPrice,
  mapsUrl,
  MIN_REVIEWS_FOR_SCHEMA,
  pickHeroPhotoUrl,
  resolveSiteUrl,
} from "./seo-utils";

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
  logoUrl?: string | null;
  socialLinks?: unknown;
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

/** Canonical site URL — prefers env, falls back to production. */
export const SITE_URL: string = resolveSiteUrl();

/** Resolve a DB category value (e.g. "Akva Park") to its display name (e.g. "Akva Parkovi"). */
export function getCategoryLabel(category: string): string {
  const slug = dbValueToSlug(category);
  return slug ? (slugToName(slug) ?? category) : category;
}

function facilityImages(facility: FacilitySchemaInput): string[] {
  const site = resolveSiteUrl();
  const photos = collectPhotoUrls(facility.media, 5).map((u) => absoluteUrl(u, site));
  const hero = pickHeroPhotoUrl(facility.media);
  if (hero) {
    const abs = absoluteUrl(hero, site);
    return [abs, ...photos.filter((p) => p !== abs)].slice(0, 5);
  }
  if (photos.length) return photos;
  return [absoluteUrl("/og-image.png", site)];
}

function priceRangeLabel(low?: number | null, high?: number | null): string {
  if (low == null) return "RSD";
  if (high != null && high > low) return `${low}–${high} RSD`;
  return `od ${low} RSD`;
}

// ── Schema: Attraction ─────────────────────────────────────────────

export function buildAttractionSchema(
  facility: FacilitySchemaInput,
  facilitySlug: string,
  operatingHours: Record<string, unknown>[],
  priceRange?: string,
) {
  const site = resolveSiteUrl();
  const images = facilityImages(facility);
  const map = mapsUrl(facility.lat, facility.lng);

  return {
    "@type": ["AmusementPark", "TouristAttraction"],
    "@id": `${site}/${facilitySlug}#attraction`,
    name: facility.name,
    description: facility.description?.slice(0, 300),
    url: `${site}/${facilitySlug}`,
    image: images,
    ...(facility.logoUrl ? { logo: absoluteUrl(facility.logoUrl, site) } : {}),
    priceRange: priceRange || "RSD",
    ...(facility.publicPhone ? { telephone: facility.publicPhone } : {}),
    isAccessibleForFree: false,
    publicAccess: true,
    availableLanguage: ["sr-Latn", "sr"],
    address: {
      "@type": "PostalAddress",
      streetAddress: `${facility.streetName} ${facility.streetNumber}`.trim(),
      addressLocality: facility.city,
      postalCode: facility.postalCode,
      addressRegion: "Srbija",
      addressCountry: "RS",
    },
    areaServed: {
      "@type": "Country",
      name: "RS",
    },
    ...(facility.lat && facility.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: Number(facility.lat),
            longitude: Number(facility.lng),
          },
        }
      : {}),
    ...(map ? { hasMap: map } : {}),
    ...(operatingHours.length > 0 ? { openingHoursSpecification: operatingHours } : {}),
  };
}

// ── Schema: Business ────────────────────────────────────────────────

export function buildBusinessSchema(
  facility: FacilitySchemaInput,
  facilitySlug: string,
  hasAggregateOffer: boolean,
  priceRange?: string,
) {
  const site = resolveSiteUrl();
  const images = facilityImages(facility);
  const facilitySameAs = extractSocialUrls(facility.socialLinks);

  return {
    "@type": "EntertainmentBusiness",
    "@id": `${site}/${facilitySlug}#business`,
    name: facility.name,
    url: `${site}/${facilitySlug}`,
    image: images,
    ...(facility.logoUrl ? { logo: absoluteUrl(facility.logoUrl, site) } : {}),
    priceRange: hasAggregateOffer ? priceRange || "RSD" : undefined,
    ...(facility.publicPhone ? { telephone: facility.publicPhone } : {}),
    ...(facilitySameAs.length ? { sameAs: facilitySameAs } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: `${facility.streetName} ${facility.streetNumber}`.trim(),
      addressLocality: facility.city,
      postalCode: facility.postalCode,
      addressRegion: "Srbija",
      addressCountry: "RS",
    },
    containsPlace: {
      "@id": `${site}/${facilitySlug}#attraction`,
    },
  };
}

// ── Schema: Product ────────────────────────────────────────────────

export function buildProductSchema(
  facility: FacilitySchemaInput,
  facilitySlug: string,
  aggregateOffer: Record<string, unknown> | null,
  ticketCount: number,
  additionalType: string,
) {
  if (!aggregateOffer) return null;

  const site = resolveSiteUrl();
  const images = facilityImages(facility);

  return {
    "@type": "Product",
    "@id": `${site}/${facilitySlug}#product`,
    name: `${facility.name} — digitalne ulaznice`,
    description: `Kupi regularne digitalne ulaznice za ${facility.name} na Splashdeals. Brza digitalna isporuka, podrška za Apple i Google Wallet. ${ticketCount} aktivnih ponuda ulaznica.`,
    image: images,
    sku: `SD-FAC-${facility.slug.toUpperCase()}`,
    mpn: `SD-MPN-${facility.slug.toUpperCase()}`,
    additionalType,
    brand: {
      "@type": "Brand",
      name: facility.name,
    },
    category: getCategoryLabel(facility.category),
    offers: aggregateOffer,
  };
}

// ── Schema: Video ──────────────────────────────────────────────────

export function buildVideoSchema(
  facility: FacilitySchemaInput,
  facilitySlug: string,
  heroMedia: Record<string, unknown> | null,
  videoThumbnail: string,
) {
  if (heroMedia?.type !== "VIDEO") return null;
  // Prefer duration; still emit video without duration when contentUrl exists
  if (!heroMedia?.url) return null;

  const site = resolveSiteUrl();
  return {
    "@type": "VideoObject",
    "@id": `${site}/${facilitySlug}#video`,
    name: `${facility.name} — promotivni video`,
    description:
      (heroMedia.caption as string) || `Promotivni video za ${facility.name} na Splashdeals`,
    contentUrl: heroMedia.url,
    thumbnailUrl: absoluteUrl(videoThumbnail, site),
    ...(heroMedia.duration ? { duration: heroMedia.duration } : {}),
    uploadDate: heroMedia.createdAt || facility.createdAt || undefined,
  };
}

// ── Schema: Breadcrumb ─────────────────────────────────────────────

export function buildBreadcrumbSchema(
  facility: FacilitySchemaInput,
  facilitySlug: string,
  categorySlug: string,
  categoryLabel: string,
) {
  const site = resolveSiteUrl();
  const normalizedCategorySlug =
    dbValueToSlug(categorySlug) || categorySlug.toLowerCase().replace(/\s+/g, "-");

  return {
    "@type": "BreadcrumbList",
    "@id": `${site}/${facilitySlug}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Početna",
        item: site,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryLabel,
        item: `${site}/${normalizedCategorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: facility.name,
        item: `${site}/${facilitySlug}`,
      },
    ],
  };
}

// ── Schema: FAQ ────────────────────────────────────────────────────

export function buildFaqSchema(
  facilitySlug: string,
  faqs?: { question: string; answer: string }[] | null,
) {
  if (!faqs?.length) return null;
  const site = resolveSiteUrl();
  return {
    "@type": "FAQPage",
    "@id": `${site}/${facilitySlug}#faq`,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

// ── Schema: Reviews ────────────────────────────────────────────────

export function buildReviewSchema(
  facility: FacilitySchemaInput,
  facilitySlug: string,
  reviews?: { rating: number; comment?: string | null; userName?: string | null }[] | null,
) {
  if (!reviews || reviews.length < MIN_REVIEWS_FOR_SCHEMA) return null;

  const ratings = reviews.map((r) => r.rating).filter((n) => n >= 1 && n <= 5);
  if (ratings.length < MIN_REVIEWS_FOR_SCHEMA) return null;

  const avg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
  const site = resolveSiteUrl();

  return {
    "@type": "Product",
    "@id": `${site}/${facilitySlug}#product`,
    name: `${facility.name} — digitalne ulaznice`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avg,
      reviewCount: ratings.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      author: {
        "@type": "Person",
        name: r.userName || "Gost Splashdeals",
      },
      ...(r.comment ? { reviewBody: r.comment } : {}),
    })),
  };
}

// ── Schema: HowTo ──────────────────────────────────────────────────

export function buildHowToSchema(facility: FacilitySchemaInput, facilitySlug: string) {
  const site = resolveSiteUrl();
  return {
    "@type": "HowTo",
    "@id": `${site}/${facilitySlug}#howto`,
    name: `Kako kupiti ulaznicu za ${facility.name}`,
    description: `Tri koraka do digitalne ulaznice za ${facility.name} na Splashdeals.`,
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Izaberite kartu",
        text: `Na stranici ${facility.name} izaberite tip i termin ulaznice.`,
        url: `${site}/${facilitySlug}#deals`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Platite online",
        text: "Dodajte u korpu i završite sigurnu online kupovinu.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Skenirajte na ulazu",
        text: "Digitalna karta stiže odmah — pokažite telefon na ulazu.",
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
  dayType?: string | null;
  timeSlot?: string | null;
  catTitle?: string | null;
  prodTitle?: string | null;
  isSeasonPass?: boolean | null;
  isEntry?: boolean;
}

interface HoursEntry {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed?: boolean;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface ReviewEntry {
  rating: number;
  comment?: string | null;
  userName?: string | null;
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
  faqs?: FaqEntry[] | null;
  reviews?: ReviewEntry[] | null;
}

function buildAggregateOffer(
  facility: FacilitySchemaInput,
  facilitySlug: string,
  tiers: TierEntry[],
  currentYear: number,
  site: string,
) {
  if (tiers.length === 0) return null;

  const prices = tiers.map((t) => Number(t.price));
  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);

  return {
    "@type": "AggregateOffer",
    priceCurrency: "RSD",
    lowPrice,
    highPrice,
    offerCount: tiers.length,
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
    offers: tiers.map((tier) => {
      const hasDiscount =
        tier.originalPrice != null && Number(tier.originalPrice) > Number(tier.price);

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

      const saleEndDate = tier.saleEnd ? new Date(tier.saleEnd) : null;
      const priceValidUntil =
        saleEndDate && !isNaN(saleEndDate.getTime())
          ? saleEndDate.toISOString().slice(0, 10)
          : `${currentYear}-12-31`;

      const saleStartDate = tier.saleStart ? new Date(tier.saleStart) : null;
      const availabilityStarts =
        saleStartDate && !isNaN(saleStartDate.getTime())
          ? saleStartDate.toISOString().slice(0, 10)
          : null;

      const availabilityEnds =
        saleEndDate && !isNaN(saleEndDate.getTime())
          ? saleEndDate.toISOString().slice(0, 10)
          : null;

      const now = new Date();
      const notYetOnSale = saleStartDate && !isNaN(saleStartDate.getTime()) && saleStartDate > now;
      const saleEnded = saleEndDate && !isNaN(saleEndDate.getTime()) && saleEndDate < now;
      const inStock = tier.isActive && !notYetOnSale && !saleEnded;

      return {
        "@type": "Offer",
        "@id": `${site}/${facilitySlug}#ticket-${tier.id}`,
        name: tier.label,
        price: Number(tier.price),
        priceCurrency: "RSD",
        priceSpecification,
        priceValidUntil,
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: `${site}/${facilitySlug}#ticket-${tier.id}`,
        acceptedPaymentMethod: [
          { "@type": "PaymentMethod", "@id": "https://schema.org/CreditCard" },
          { "@type": "PaymentMethod", "@id": "https://schema.org/PaymentMethodTypeWallet" },
        ],
        ...(availabilityStarts ? { availabilityStarts } : {}),
        ...(availabilityEnds ? { availabilityEnds } : {}),
        ...(tier.minPeople || tier.maxPeople
          ? {
              eligibleQuantity: {
                "@type": "QuantitativeValue",
                ...(tier.minPeople ? { minValue: Number(tier.minPeople) } : {}),
                ...(tier.maxPeople ? { maxValue: Number(tier.maxPeople) } : {}),
              },
            }
          : {}),
        seller: {
          "@type": "Organization",
          "@id": `${site}/#organization`,
          name: "SplashDeals",
          url: site,
        },
        provider: {
          "@type": "LocalBusiness",
          "@id": `${site}/${facilitySlug}#business`,
          name: facility.name,
          ...(facility.publicPhone ? { telephone: facility.publicPhone } : {}),
          address: {
            "@type": "PostalAddress",
            streetAddress: `${facility.streetName} ${facility.streetNumber}`.trim(),
            addressLocality: facility.city,
            postalCode: facility.postalCode,
            addressCountry: "RS",
          },
        },
      };
    }),
  };
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
    faqs,
    reviews,
  } = params;

  const site = resolveSiteUrl();

  const resolvedCategorySlug =
    dbValueToSlug(facility.category) ||
    dbValueToSlug(categorySlug) ||
    categorySlug.toLowerCase().replace(/\s+/g, "-");

  const additionalType =
    resolvedCategorySlug === "akva-parkovi"
      ? "https://www.wikidata.org/wiki/Q740331"
      : resolvedCategorySlug === "bazeni"
        ? "https://www.wikidata.org/wiki/Q64528"
        : "https://www.wikidata.org/wiki/Q11947";

  // Entry tickets only for main Product AggregateOffer
  const entryTiers = allTiers.filter((t) =>
    t.isEntry !== undefined
      ? t.isEntry
      : isEntryTicketPrice({
          catTitle: t.catTitle,
          prodTitle: t.prodTitle || t.label,
          isSeasonPass: t.isSeasonPass,
        }),
  );
  const tiersForProduct = entryTiers.length > 0 ? entryTiers : allTiers;

  const aggregateOffer = buildAggregateOffer(
    facility,
    facilitySlug,
    tiersForProduct,
    currentYear,
    site,
  );

  const entryPrices = tiersForProduct.map((t) => Number(t.price));
  const prLabel =
    entryPrices.length > 0
      ? priceRangeLabel(Math.min(...entryPrices), Math.max(...entryPrices))
      : "RSD";

  const videoThumbnailFallback =
    pickHeroPhotoUrl(facility.media) ||
    facility.media?.find((m) => m.type === "PHOTO")?.url ||
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
    hours
      ?.filter((h) => !h.isClosed)
      .map((h) => ({
        "@type": "OpeningHoursSpecification" as const,
        dayOfWeek: DAY_NAMES[h.dayOfWeek],
        opens: h.openTime,
        closes: h.closeTime,
      })) ?? [];

  const productNode = buildProductSchema(
    facility,
    facilitySlug,
    aggregateOffer,
    entryTiers.length || ticketCount,
    additionalType,
  );

  // Merge review aggregate onto product when available
  const reviewNode = buildReviewSchema(facility, facilitySlug, reviews);
  if (productNode && reviewNode) {
    Object.assign(productNode, {
      aggregateRating: reviewNode.aggregateRating,
      review: reviewNode.review,
    });
  }

  const itemList =
    tiersForProduct.length > 1
      ? {
          "@type": "ItemList",
          "@id": `${site}/${facilitySlug}#ticket-list`,
          name: `Ulaznice — ${facility.name}`,
          numberOfItems: tiersForProduct.length,
          itemListElement: tiersForProduct.slice(0, 12).map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: t.label,
            url: `${site}/${facilitySlug}#ticket-${t.id}`,
          })),
        }
      : null;

  return {
    "@context": "https://schema.org",
    "@graph": [
      buildAttractionSchema(facility, facilitySlug, operatingHours, prLabel),
      buildBusinessSchema(facility, facilitySlug, !!aggregateOffer, prLabel),
      productNode,
      buildVideoSchema(facility, facilitySlug, heroMedia, videoThumbnail),
      buildBreadcrumbSchema(
        facility,
        facilitySlug,
        resolvedCategorySlug,
        categoryLabel || getCategoryLabel(facility.category),
      ),
      buildFaqSchema(facilitySlug, faqs),
      buildHowToSchema(facility, facilitySlug),
      itemList,
    ].filter(Boolean),
  };
}
