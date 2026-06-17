import { notFound, permanentRedirect, redirect } from "next/navigation";
import { Metadata } from "next";
import { connection } from "next/server";
import { prisma } from "@/server/lib/prisma";
import { FacilityShowcaseTemplate, getFacilityMetadata } from "../facilities/[categorySlug]/[facilitySlug]/page";
import { DiscoveryTemplate, getDiscoveryMetadata } from "@/lib/routing/discovery";

/**
 * 🏝️ Dynamic Short-URL Resolver Helper
 * Checks the nature of the first path segment against the database.
 */
async function resolveSlug(firstSlug: string) {
  // 1. Check if category
  const hasCategory = await prisma.facility.findFirst({
    where: { category: { equals: firstSlug, mode: "insensitive" } },
    select: { category: true }
  });
  if (hasCategory) {
    return { type: "category", category: hasCategory.category.toLowerCase().replace(/\s+/g, '-') };
  }

  // 2. Check if facility
  const facility = await prisma.facility.findUnique({
    where: { slug: firstSlug, status: "ACTIVE" },
    select: { slug: true, category: true }
  });
  if (facility) {
    return { type: "facility", category: facility.category.toLowerCase().replace(/\s+/g, '-') };
  }

  return null;
}

/**
 * 🗑️ Permanently deleted legacy paths — return 410 Gone
 * These URLs were indexed by Google and must return 410 so Google
 * removes them from the index entirely. No redirects.
 */
const DELETED_PATHS = new Set([
  "en/facilities/waterpark/petroland",
  "facilities/waterpark/petroland",
  "waterpark/petroland",
  "en/waterpark/petroland",
  "rs/waterpark/petroland",
  "waterpark",
  "en/waterpark",
  "rs/waterpark",
  "facilities/waterpark",
  "en/facilities/waterpark",
  "rs/facilities/waterpark",
]);

function isDeletedPath(slug: string[]): boolean {
  const path = slug.join("/");
  if (DELETED_PATHS.has(path)) return true;
  
  // Also check if the path without the i18n prefix is deleted
  if (slug.length > 1 && (slug[0] === "en" || slug[0] === "rs")) {
    return DELETED_PATHS.has(slug.slice(1).join("/"));
  }
  
  return false;
}

/**
 * 🗑️ Legacy Prefix Resolver
 * Given a legacy /en/... or /rs/... path, resolves the final clean URL
 * by looking up the facility slug directly. Returns the direct target
 * so we can 301 straight there — no intermediate hops that Google can index.
 */
async function resolveLegacyTarget(slugs: string[]): Promise<string | null> {
  // Strip the prefix
  const cleanSegments = slugs.slice(1);
  if (cleanSegments.length === 0) return "/";

  // Try to find a facility slug in the path
  // Legacy patterns:
  //   /en/facilities/waterpark/petroland → facility slug = petroland
  //   /rs/explore/waterpark/aquapark-petroland → facility slug = aquapark-petroland
  //   /en/facilities/nis → facility slug = nis
  
  // Check the last segment as a facility slug
  const lastSegment = cleanSegments[cleanSegments.length - 1];
  const facility = await prisma.facility.findUnique({
    where: { slug: lastSegment, status: "ACTIVE" },
    select: { slug: true }
  });
  if (facility) {
    return "/" + facility.slug;
  }

  // Fallback: do not blindly redirect to a stripped path which might be a 404.
  // Returning null lets the router handle it naturally.
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;

  // Permanently deleted legacy paths — 410 Gone (check BEFORE connection/DB calls)
  if (slug && isDeletedPath(slug)) {
    return {
      title: "Page Deleted",
      robots: { index: false, follow: false },
    };
  }

  // NOTE: connection() is intentionally NOT called here — duplicate connection() calls
  // across generateMetadata + page component cause RSC resumable slot mismatches
  // in Next.js 16: "Couldn't find all resumable slots by key/index during replaying".
  // FacilityShowcaseTemplate (rendered below) calls its own connection() at line ~295
  // which is sufficient for the dynamic signal.

  // Legacy /en/ and /rs/ prefix routes → resolve final target and 301 directly
  if (slug && (slug[0] === "en" || slug[0] === "rs")) {
    const target = await resolveLegacyTarget(slug);
    if (target) permanentRedirect(target);
  }
  
  if (slug && slug.length === 1) {
    const resolved = await resolveSlug(slug[0]);
    if (resolved) {
      if (resolved.type === "facility") {
        return await getFacilityMetadata(slug[0], resolved.category!);
      }
      return await getDiscoveryMetadata(slug[0]);
    }
  }

  if (slug && slug.length === 2) {
    if (slug[1] === "dnevne-ulaznice") {
      const resolved = await resolveSlug(slug[0]);
      if (resolved && resolved.type === "facility") {
        return await getFacilityMetadata(slug[0], resolved.category!, "dnevne-ulaznice");
      }
    }

    const facility = await prisma.facility.findUnique({
      where: { slug: slug[1], status: "ACTIVE" },
      select: { slug: true }
    });
    if (facility) {
      permanentRedirect(`/${facility.slug}`);
    }
  }

  // /[facilitySlug]/ticket/[ticketSlug] → 301 to /{facilitySlug}#deals
  // These URLs are in the sitemap but the ticket purchase UI lives on the facility page.
  if (slug && slug.length === 3 && slug[1] === "ticket") {
    const facility = await prisma.facility.findUnique({
      where: { slug: slug[0], status: "ACTIVE" },
      select: { slug: true }
    });
    if (facility) {
      permanentRedirect(`/${facility.slug}#deals`);
    }
  }

  notFound();
}

/**
 * 🌊 Catch-All Interceptor
 * Forces all unmatched routes within the routing segment to trigger 
 * the custom 404 UI located in the (web) group, while automatically
 * stripping legacy locale prefixes via direct 301 redirects (no intermediate hops),
 * or serving the dynamic prefix-free facility & category listings natively.
 */
export default async function CatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;

  // Permanently deleted legacy paths — 410 Gone (MUST run BEFORE connection() or any DB call,
  // because if the DB errors out, the Next.js error boundary catches it and returns 200 instead of 410)
  if (slug && isDeletedPath(slug)) {
    const body = `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>410 Gone</title></head><body style="background:#020617;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center"><div style="font-size:6rem;font-weight:900;color:#06b6d4;margin:0">410</div><p style="font-size:1.25rem;margin-top:0.5rem">This page has been permanently deleted.</p></div></body></html>`;
    return new Response(body, { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // NOTE: connection() is intentionally NOT called here — duplicate connection() calls
  // cause RSC resumable slot mismatches in Next.js 16:
  // "Couldn't find all resumable slots by key/index during replaying".
  // FacilityShowcaseTemplate (rendered below) calls its own connection() which is sufficient.

  // Legacy /en/ and /rs/ prefix routes → resolve final target and 301 directly
  if (slug && (slug[0] === "en" || slug[0] === "rs")) {
    const target = await resolveLegacyTarget(slug);
    if (target) permanentRedirect(target);
  }
  
  if (slug && slug.length === 1) {
    const resolved = await resolveSlug(slug[0]);
    if (resolved) {
      if (resolved.type === "facility") {
        return (
          <FacilityShowcaseTemplate
            params={Promise.resolve({
              categorySlug: resolved.category!,
              facilitySlug: slug[0]
            })}
          />
        );
      }
      return (
        <DiscoveryTemplate
          params={Promise.resolve({
            categorySlug: slug[0]
          })}
        />
      );
    }
  }

  if (slug && slug.length === 2) {
    if (slug[1] === "dnevne-ulaznice") {
      const resolved = await resolveSlug(slug[0]);
      if (resolved && resolved.type === "facility") {
        return (
          <FacilityShowcaseTemplate
            params={Promise.resolve({
              categorySlug: resolved.category!,
              facilitySlug: slug[0]
            })}
          />
        );
      }
    }

    const facility = await prisma.facility.findUnique({
      where: { slug: slug[1], status: "ACTIVE" },
      select: { slug: true }
    });
    if (facility) {
      permanentRedirect(`/${facility.slug}`);
    }
  }

  // /[facilitySlug]/ticket/[ticketSlug] → 301 to /{facilitySlug}#deals
  // These URLs were indexed/sitemapped but the ticket UI lives on the facility page.
  // A 301 consolidates link equity into the canonical facility URL.
  if (slug && slug.length === 3 && slug[1] === "ticket") {
    const facility = await prisma.facility.findUnique({
      where: { slug: slug[0], status: "ACTIVE" },
      select: { slug: true }
    });
    if (facility) {
      permanentRedirect(`/${facility.slug}#deals`);
    }
  }

  notFound();
}
