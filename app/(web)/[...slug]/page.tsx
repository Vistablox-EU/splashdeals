import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/server/lib/prisma";
import { FacilityShowcaseTemplate } from "../_facility/page";
import { buildFacilityMetadata } from "../_facility/_head";
import { DiscoveryTemplate, getDiscoveryMetadata } from "@/lib/routing/discovery";
import { isDeletedPath, resolveSlug, resolveLegacyTarget } from "@/lib/routing/resolve-slug";

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
        return await buildFacilityMetadata(slug[0], resolved.category);
      }
      return await getDiscoveryMetadata(slug[0]);
    }
  }

  if (slug && slug.length === 2) {
    if (slug[1] === "dnevne-ulaznice") {
      const resolved = await resolveSlug(slug[0]);
      if (resolved && resolved.type === "facility") {
        return await buildFacilityMetadata(slug[0], resolved.category, "dnevne-ulaznice");
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
              categorySlug: resolved.category,
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
              categorySlug: resolved.category,
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
