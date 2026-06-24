import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/server/lib/prisma";
import { serialize } from "@/lib/serialize";
import { calculateMaxDiscount } from "@/lib/utils/pricing";
import { catLabelMap, SITE_URL } from "./schemas";

// ── Types ────────────────────────────────────────────────────────

type FacilityWithIncludes = Prisma.FacilityGetPayload<{
  include: {
    media: { orderBy: { order: "asc" } };
    ticketCategories: {
      where: { isActive: true };
      include: {
        types: {
          where: { isActive: true };
          include: {
            prices: {
              where: { isActive: true };
              orderBy: { displayOrder: "asc" };
            };
          };
          orderBy: { displayOrder: "asc" };
        };
      };
      orderBy: { displayOrder: "asc" };
    };
    policy: true;
    hours: { orderBy: { dayOfWeek: "asc" } };
    amenities: { include: { amenity: true }; orderBy: { displayOrder: "asc" } };
    marketplaceCities: { include: { city: true } };
    faqs: { orderBy: { displayOrder: "asc" } };
  };
}>;

export type { FacilityWithIncludes };

// ── Typed helpers for ticket data ─────────────────────────────────

export interface FlattenedPrice {
  id: string;
  price: number | { toString: () => string };
  originalPrice: number | null | { toString: () => string };
  isActive: boolean;
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
      (prod.prices || []).filter((p) => p.isActive).map((p) => ({
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
      }))
    )
  );
}

export function buildTicketGroups(facility: FacilityWithIncludes): TicketGroup[] {
  if (facility.ticketCategories && facility.ticketCategories.length > 0) {
    return facility.ticketCategories.map((cat) => ({
      id: cat.id,
      title: cat.title,
      description: null,
      slug: cat.slug || cat.title.toLowerCase().replace(/\s+/g, "-"),
      tiers: (cat.types || []).filter((prod) => prod.isActive).map((prod) => ({
        id: prod.id,
        title: prod.title,
        label: prod.title,
        price: Math.min(...(prod.prices || []).filter((p) => p.isActive).map((p) => Number(p.price))),
        originalPrice: null,
        minPeople: prod.minPeople || 1,
        maxPeople: prod.maxPeople || null,
        dayType: null,
        timeSlot: null,
        isSeasonPass: prod.isSeasonPass,
        requiresIdentity: prod.requiresIdentity,
        requiresPhoto: prod.requiresPhoto,
        imageUrl: prod.imageUrl || facility.media?.[0]?.url || null,
        slug: null,
        description: null,
        seasonStart: null,
        seasonEnd: null,
        isActive: true,
      }))
    }));
  }

  const allPrices = flattenActivePrices(facility);
  if (allPrices.length > 0) {
    return [{
      id: "default-group",
      title: "Standardne Ponude",
      description: "Standardne ponude i ulaznice koje nisu deo posebnih paketa.",
      slug: "standardne-ponude",
      tiers: allPrices.map((p) => ({
        id: p.id,
        title: p.prodTitle,
        label: p.prodTitle,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        minPeople: p.minPeople || 1,
        maxPeople: p.maxPeople || null,
        dayType: p.dayType,
        timeSlot: p.timeSlot,
        isSeasonPass: p.isSeasonPass,
        requiresIdentity: p.requiresIdentity,
        requiresPhoto: p.requiresPhoto,
        imageUrl: facility.media?.[0]?.url || null,
        slug: null,
        description: null,
        seasonStart: null,
        seasonEnd: null,
        isActive: true,
      }))
    }];
  }

  return [];
}

// ── Fetcher (shared with the page component) ─────────────────────

export const getFacility = cache(async (slug: string): Promise<FacilityWithIncludes | null> => {
  const result = await prisma.facility.findUnique({
    where: { slug },
    include: {
      media: { orderBy: { order: "asc" } },
      ticketCategories: {
        where: { isActive: true },
        include: {
          types: {
            where: { isActive: true },
            include: {
              prices: {
                where: { isActive: true },
                orderBy: { displayOrder: "asc" },
              },
            },
            orderBy: { displayOrder: "asc" },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
      policy: true,
      hours: { orderBy: { dayOfWeek: "asc" } },
      amenities: { include: { amenity: true }, orderBy: { displayOrder: "asc" } },
      marketplaceCities: { include: { city: true } },
      faqs: { orderBy: { displayOrder: "asc" } },
    },
  });

  if (result) return serialize(result);
  return null;
});

// ── Metadata builder ─────────────────────────────────────────────

export async function buildFacilityMetadata(
  facilitySlug: string,
  categorySlug: string,
  subPath?: string,
): Promise<Metadata> {
  const facility = await getFacility(facilitySlug);
  if (!facility) notFound();

  const currentYear = new Date().getFullYear();
  const categoryLabel = catLabelMap[facility.category.toLowerCase()] ?? facility.category;

  // Flatten ticket data for price / count hints
  const tickets = flattenActivePrices(facility);
  const ticketCount = tickets.length;
  const ticketHint =
    ticketCount > 0 ? ` | ${ticketCount} vrsta ulaznica dostupno` : "";

  const minPrice =
    ticketCount > 0
      ? Math.min(
          ...tickets.map(
            (t: { price: number | { toString: () => string } }) => Number(t.price),
          ),
        )
      : null;
  const priceHint = minPrice ? ` Već od ${minPrice} RSD!` : "";

  const maxDiscount = calculateMaxDiscount(
    tickets.map(
      (t: { isActive: boolean; price: unknown; originalPrice: unknown | null }) => ({
        isActive: t.isActive,
        price: Number(t.price),
        originalPrice: t.originalPrice ? Number(t.originalPrice) : null,
      }),
    ),
  );

  // Localize and normalize name (e.g. "AquaPark Petroland" -> "Akva park Petroland")
  const localizedName = facility.name
    .replace(/\bAquaPark\b/gi, "Akva park")
    .replace(/\bAqua Park\b/gi, "Akva park");

  const fallbackTitle =
    maxDiscount > 0
      ? `${localizedName} ${facility.city} Ulaznice - Uštedi do ${maxDiscount}%`
      : `${localizedName} ${facility.city} Ulaznice ${currentYear}`;

  const rawTitle = facility.metaTitle || fallbackTitle;

  // Strip trailing brand suffix to prevent root layout from duplicating it
  const title = rawTitle
    .replace(/\s*\|\s*Splash\s*Deals\s*$/i, "")
    .replace(/\s*\|\s*Splashdeals\s*$/i, "");

  // Description
  const fallbackDescription = `Kupi ulaznice za ${facility.name} u ${facility.city}.${priceHint} Najbolje cene za ${categoryLabel.toLowerCase()} u Srbiji na Splashdeals.`;
  const baseDescription =
    facility.metaDescription ||
    facility.description?.slice(0, 140) ||
    fallbackDescription;
  const finalDescription = baseDescription.includes("Već od")
    ? baseDescription
    : `${baseDescription}${priceHint}${ticketHint}`;

  // OG image
  const ogImage =
    facility.media.find(
      (m: { isHero?: boolean; isCardBackground?: boolean; type?: string; url?: string }) =>
        m.type === "PHOTO" && m.isHero,
    )?.url ??
    facility.media.find(
      (m: { isHero?: boolean; isCardBackground?: boolean; type?: string; url?: string }) =>
        m.type === "PHOTO" && m.isCardBackground,
    )?.url ??
    facility.media.find(
      (m: { isHero?: boolean; isCardBackground?: boolean; type?: string; url?: string }) =>
        m.type === "PHOTO",
    )?.url ??
    "/og-image.png";

  // Canonical URL
  const canonicalUrl = subPath
    ? `${SITE_URL}/${facilitySlug}/${subPath}`
    : `${SITE_URL}/${facilitySlug}`;

  return {
    title,
    description: finalDescription,
    robots: { index: true, follow: true },
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
        { url: ogImage, width: 1200, height: 630, alt: facility.name },
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
