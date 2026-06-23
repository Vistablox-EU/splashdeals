import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/server/lib/prisma";
import { serialize } from "@/lib/serialize";
import { calculateMaxDiscount } from "@/lib/utils/pricing";
import { catLabelMap, SITE_URL } from "../_schemas";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tickets = (facility.ticketCategories || []).flatMap((cat: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cat.types || []).flatMap((prod: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prod.prices || []).filter((p: any) => p.isActive),
    ),
  );
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
