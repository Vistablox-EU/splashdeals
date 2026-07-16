/**
 * Facility SEO helpers — entry-price rules, offer labels, social links, site URL.
 * Used by metadata.ts, schemas.ts, and OG routes.
 */

import { getDayTypeLabel, getTimeSlotLabel } from "@/lib/ticketing/day-time-labels";

/** Categories treated as non-entry extras (not “from X RSD” entry tickets). */
const EXTRA_CATEGORY_RE =
  /dopunsk|uslug|parking|ležalj|lezalj|baldahin|garderob|suncobran|rent|oprema|dodat/i;

/** Product titles that are amenity extras even under entry categories. */
const EXTRA_PRODUCT_RE =
  /parking|ležalj|lezalj|baldahin|garderob|suncobran|ormarić|ormaric|peškir|peskir/i;

/** Resident / office-only style products — still schema’d but flagged carefully. */
const RESIDENT_PRODUCT_RE = /stanovnik|mesecn|mesečn|sezon|resident|opštin|opstin/i;

export function resolveSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "https://www.splashdeals.rs";
  return raw.replace(/\/$/, "");
}

export function isExtraCategoryTitle(title: string | null | undefined): boolean {
  if (!title) return false;
  return EXTRA_CATEGORY_RE.test(title);
}

export function isExtraProductTitle(title: string | null | undefined): boolean {
  if (!title) return false;
  return EXTRA_PRODUCT_RE.test(title);
}

export function isResidentOrPassProduct(title: string | null | undefined): boolean {
  if (!title) return false;
  return RESIDENT_PRODUCT_RE.test(title);
}

/** True when this price row should drive “Već od” / primary Product AggregateOffer. */
export function isEntryTicketPrice(input: {
  catTitle?: string | null;
  prodTitle?: string | null;
  isSeasonPass?: boolean | null;
}): boolean {
  if (input.isSeasonPass) return false;
  if (isExtraCategoryTitle(input.catTitle)) return false;
  if (isExtraProductTitle(input.prodTitle)) return false;
  if (isResidentOrPassProduct(input.prodTitle)) return false;
  return true;
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toString" in value) {
    return Number((value as { toString: () => string }).toString());
  }
  return Number(value);
}

export function buildOfferLabel(parts: {
  prodTitle: string;
  priceLabel?: string | null;
  dayType?: string | null;
  timeSlot?: string | null;
}): string {
  if (parts.priceLabel?.trim()) {
    return `${parts.prodTitle} · ${parts.priceLabel.trim()}`;
  }
  const day = parts.dayType && parts.dayType !== "ALL" ? getDayTypeLabel(parts.dayType) : null;
  const time =
    parts.timeSlot && parts.timeSlot !== "FULL_DAY" ? getTimeSlotLabel(parts.timeSlot) : null;
  const suffix = [day, time].filter(Boolean).join(" · ");
  return suffix ? `${parts.prodTitle} · ${suffix}` : parts.prodTitle;
}

export function extractSocialUrls(socialLinks: unknown): string[] {
  if (!socialLinks || typeof socialLinks !== "object") return [];
  const obj = socialLinks as Record<string, unknown>;
  const urls: string[] = [];
  for (const key of ["website", "facebook", "instagram", "twitter", "x", "youtube", "tiktok"]) {
    const v = obj[key];
    if (typeof v === "string" && /^https?:\/\//i.test(v.trim())) {
      urls.push(v.trim());
    }
  }
  // Also accept array of strings
  if (Array.isArray(obj.links)) {
    for (const item of obj.links) {
      if (typeof item === "string" && /^https?:\/\//i.test(item)) urls.push(item);
    }
  }
  return [...new Set(urls)];
}

export function pickHeroPhotoUrl(
  media?:
    | {
        url: string;
        type?: string | null;
        isHero?: boolean | null;
        isCardBackground?: boolean | null;
      }[]
    | null,
): string | null {
  if (!media?.length) return null;
  const photos = media.filter((m) => !m.type || m.type === "PHOTO");
  return (
    photos.find((m) => m.isHero)?.url ||
    photos.find((m) => m.isCardBackground)?.url ||
    photos[0]?.url ||
    null
  );
}

export function collectPhotoUrls(
  media?: { url: string; type?: string | null }[] | null,
  limit = 5,
): string[] {
  if (!media?.length) return [];
  return media
    .filter((m) => !m.type || m.type === "PHOTO")
    .map((m) => m.url)
    .filter(Boolean)
    .slice(0, limit);
}

export function stripBrandSuffix(title: string): string {
  return title
    .replace(/\s*\|\s*Splash\s*Deals\s*$/i, "")
    .replace(/\s*\|\s*Splashdeals\s*$/i, "")
    .trim();
}

export function absoluteUrl(pathOrUrl: string, siteUrl = resolveSiteUrl()): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith("//")) return `https:${pathOrUrl}`;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl}${path}`;
}

export function mapsUrl(lat?: number | string | null, lng?: number | string | null): string | null {
  if (lat == null || lng == null || lat === "" || lng === "") return null;
  const la = Number(lat);
  const ln = Number(lng);
  if (Number.isNaN(la) || Number.isNaN(ln)) return null;
  return `https://www.google.com/maps?q=${la},${ln}`;
}

export function facilityIndexable(status?: string | null): boolean {
  if (!status) return true;
  return status === "ACTIVE";
}

export const MIN_REVIEWS_FOR_SCHEMA = 3;
