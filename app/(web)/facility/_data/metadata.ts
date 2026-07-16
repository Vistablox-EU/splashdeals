import { Metadata } from "next";
import { notFound } from "next/navigation";
import { calculateMaxDiscount } from "@/lib/utils/pricing";
import { getCategoryLabel } from "./schemas";
import type { FacilityWithIncludes } from "./getFacilityQuery";
import { getFacilityBySlug as getFacility } from "./getFacilityQuery";
import {
  absoluteUrl,
  buildOfferLabel,
  facilityIndexable,
  isEntryTicketPrice,
  pickHeroPhotoUrl,
  resolveSiteUrl,
  stripBrandSuffix,
  toNumber,
} from "./seo-utils";

export type { FacilityWithIncludes };

// ── Typed helpers for ticket data ─────────────────────────────────

export interface FlattenedPrice {
  id: string;
  price: number | { toString: () => string };
  originalPrice: number | null | { toString: () => string };
  isActive: boolean;
  label?: string | null;
  saleStart?: Date | string | null;
  saleEnd?: Date | string | null;
  validFrom?: Date | string | null;
  validTo?: Date | string | null;
  catTitle: string;
  prodTitle: string;
  prodDescription: string | null;
  requiresIdentity: boolean;
  requiresPhoto: boolean;
  minPeople: number;
  maxPeople: number | null;
  isSeasonPass: boolean;
  validityType: string | null;
  dayType: string | null;
  timeSlot: string | null;
}

export interface TicketGroupTier {
  id: string;
  title: string;
  label: string;
  price: number;
  originalPrice: number | null;
  minPeople: number;
  maxPeople: number | null;
  dayType: string | null;
  timeSlot: string | null;
  isSeasonPass: boolean;
  isActive: boolean;
  requiresIdentity: boolean;
  requiresPhoto: boolean;
  imageUrl: string | null;
  slug: string | null;
  description: string | null;
  seasonStart: Date | null;
  seasonEnd: Date | null;
  saleStart?: Date | string | null;
  saleEnd?: Date | string | null;
  catTitle?: string;
  prodTitle?: string;
  isEntry?: boolean;
}

export interface TicketGroup {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  tiers: TicketGroupTier[];
}

export function flattenActivePrices(facility: FacilityWithIncludes): FlattenedPrice[] {
  return (facility.ticketCategories || []).flatMap((cat) =>
    (cat.types || []).flatMap((prod) =>
      (prod.prices || [])
        .filter((p) => p.isActive)
        .map((p) => ({
          ...p,
          catTitle: cat.title,
          prodTitle: prod.title,
          prodDescription: prod.description,
          requiresIdentity: prod.requiresIdentity,
          requiresPhoto: prod.requiresPhoto,
          minPeople: prod.minPeople,
          maxPeople: prod.maxPeople,
          isSeasonPass: prod.isSeasonPass,
          validityType: prod.validityType,
        })),
    ),
  );
}

/** Price-level tiers for UI + schema (does not collapse variants). */
export function buildPriceLevelTiers(facility: FacilityWithIncludes): TicketGroupTier[] {
  return flattenActivePrices(facility).map((p) => {
    const price = toNumber(p.price);
    const originalPrice = p.originalPrice != null ? toNumber(p.originalPrice) : null;
    return {
      id: p.id,
      title: p.prodTitle,
      label: buildOfferLabel({
        prodTitle: p.prodTitle,
        priceLabel: p.label,
        dayType: p.dayType,
        timeSlot: p.timeSlot,
      }),
      price,
      originalPrice: originalPrice != null && originalPrice > price ? originalPrice : null,
      minPeople: p.minPeople || 1,
      maxPeople: p.maxPeople || null,
      dayType: p.dayType,
      timeSlot: p.timeSlot,
      isSeasonPass: p.isSeasonPass,
      isActive: p.isActive,
      requiresIdentity: p.requiresIdentity,
      requiresPhoto: p.requiresPhoto,
      imageUrl: pickHeroPhotoUrl(facility.media) || null,
      slug: null,
      description: p.prodDescription,
      seasonStart: null,
      seasonEnd: null,
      saleStart: p.saleStart ?? p.validFrom ?? null,
      saleEnd: p.saleEnd ?? p.validTo ?? null,
      catTitle: p.catTitle,
      prodTitle: p.prodTitle,
      isEntry: isEntryTicketPrice({
        catTitle: p.catTitle,
        prodTitle: p.prodTitle,
        isSeasonPass: p.isSeasonPass,
      }),
    };
  });
}

/**
 * UI groups: product-level collapse for display rails.
 * Schema should use buildPriceLevelTiers / flattenActivePrices instead.
 */
export function buildTicketGroups(facility: FacilityWithIncludes): TicketGroup[] {
  if (facility.ticketCategories && facility.ticketCategories.length > 0) {
    return facility.ticketCategories.map((cat) => ({
      id: cat.id,
      title: cat.title,
      description: null,
      slug: cat.slug || cat.title.toLowerCase().replace(/\s+/g, "-"),
      tiers: (cat.types || [])
        .filter((prod) => prod.isActive)
        .map((prod) => {
          const active = (prod.prices || []).filter((p) => p.isActive);
          const prices = active.map((p) => toNumber(p.price));
          const minPrice = prices.length ? Math.min(...prices) : 0;
          const originals = active
            .map((p) => (p.originalPrice != null ? toNumber(p.originalPrice) : null))
            .filter((n): n is number => n != null && n > minPrice);
          return {
            id: prod.id,
            title: prod.title,
            label: prod.title,
            price: minPrice,
            originalPrice: originals.length ? Math.min(...originals) : null,
            minPeople: prod.minPeople || 1,
            maxPeople: prod.maxPeople || null,
            dayType: null,
            timeSlot: null,
            isSeasonPass: prod.isSeasonPass,
            requiresIdentity: prod.requiresIdentity,
            requiresPhoto: prod.requiresPhoto,
            imageUrl: prod.imageUrl || pickHeroPhotoUrl(facility.media) || null,
            slug: prod.slug || null,
            description: prod.description,
            seasonStart: null,
            seasonEnd: null,
            isActive: true,
            catTitle: cat.title,
            prodTitle: prod.title,
            isEntry: isEntryTicketPrice({
              catTitle: cat.title,
              prodTitle: prod.title,
              isSeasonPass: prod.isSeasonPass,
            }),
          };
        }),
    }));
  }

  const allPrices = flattenActivePrices(facility);
  if (allPrices.length > 0) {
    return [
      {
        id: "default",
        title: "Ulaznice",
        description: null,
        slug: "ulaznice",
        tiers: buildPriceLevelTiers(facility),
      },
    ];
  }

  return [];
}

export function getEntryTicketPrices(facility: FacilityWithIncludes): FlattenedPrice[] {
  return flattenActivePrices(facility).filter((p) =>
    isEntryTicketPrice({
      catTitle: p.catTitle,
      prodTitle: p.prodTitle,
      isSeasonPass: p.isSeasonPass,
    }),
  );
}

export function getEntryMinPrice(facility: FacilityWithIncludes): number | null {
  const entry = getEntryTicketPrices(facility);
  if (entry.length === 0) return null;
  return Math.min(...entry.map((t) => toNumber(t.price)));
}

export { getFacility };

// ── Metadata builder ─────────────────────────────────────────────

export async function buildFacilityMetadata(
  facilitySlug: string,
  _categorySlug: string,
): Promise<Metadata> {
  const facility = await getFacility(facilitySlug);
  if (!facility) notFound();

  const siteUrl = resolveSiteUrl();
  const currentYear = new Date().getFullYear();
  const categoryLabel = getCategoryLabel(facility.category);
  const indexable = facilityIndexable((facility as { status?: string | null }).status ?? "ACTIVE");

  const entryTickets = getEntryTicketPrices(facility);
  const allTickets = flattenActivePrices(facility);
  const ticketCount = entryTickets.length || allTickets.length;

  const minPrice = getEntryMinPrice(facility);
  const priceHint = minPrice != null ? ` Već od ${minPrice} RSD!` : "";
  const ticketHint = ticketCount > 0 ? ` | ${ticketCount} vrsta ulaznica dostupno` : "";

  const maxDiscount = calculateMaxDiscount(
    entryTickets.map((t) => ({
      isActive: t.isActive,
      price: toNumber(t.price),
      originalPrice: t.originalPrice != null ? toNumber(t.originalPrice) : null,
    })),
  );

  const localizedName = facility.name
    .replace(/\bAquaPark\b/gi, "Akva park")
    .replace(/\bAqua Park\b/gi, "Akva park");

  const cityPart =
    facility.city && !localizedName.toLowerCase().includes(facility.city.toLowerCase())
      ? ` ${facility.city}`
      : "";

  const fallbackTitle =
    maxDiscount > 0
      ? `${localizedName}${cityPart} ulaznice — uštedi do ${maxDiscount}%`
      : `${localizedName}${cityPart} ulaznice ${currentYear}`;

  const rawTitle = facility.metaTitle || fallbackTitle;
  const title = stripBrandSuffix(rawTitle);

  const seasonHint = ` Sezona ${currentYear}.`;
  const fallbackDescription = `Kupi regularne ulaznice za ${facility.name}${facility.city ? ` u ${facility.city}` : ""}.${priceHint} Digitalna karta za ${categoryLabel.toLowerCase()} na Splashdeals.${seasonHint}`;
  const baseDescription =
    facility.metaDescription || facility.description?.slice(0, 140) || fallbackDescription;

  let finalDescription = baseDescription;
  if (!/već od|vec od/i.test(finalDescription) && priceHint) {
    finalDescription = `${finalDescription}${priceHint}`;
  }
  if (!/vrsta ulaznica/i.test(finalDescription) && ticketHint) {
    finalDescription = `${finalDescription}${ticketHint}`;
  }
  if (finalDescription.length > 300) {
    finalDescription = `${finalDescription.slice(0, 297)}…`;
  }

  const canonicalUrl = absoluteUrl(`/${facilitySlug}`, siteUrl);
  const ogImage = absoluteUrl(`/api/og/facility/${facilitySlug}`, siteUrl);
  const heroPhoto = pickHeroPhotoUrl(facility.media);

  return {
    title,
    description: finalDescription,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "sr-RS": canonicalUrl,
        sr: canonicalUrl,
        "x-default": canonicalUrl,
      },
    },
    openGraph: {
      title,
      description: finalDescription,
      url: canonicalUrl,
      siteName: "SplashDeals",
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: 1200,
          height: 630,
          alt: `${facility.name}${facility.city ? ` — ${facility.city}` : ""}`,
        },
        ...(heroPhoto
          ? [
              {
                url: absoluteUrl(heroPhoto, siteUrl),
                width: 1200,
                height: 630,
                alt: facility.name,
              },
            ]
          : []),
      ],
      locale: "sr_RS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: finalDescription,
      images: [ogImage],
    },
  };
}
