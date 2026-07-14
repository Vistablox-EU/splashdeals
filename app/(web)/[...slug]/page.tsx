import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/app/(server)/lib/prisma";
import { FacilityShowcaseTemplate } from "@/app/(web)/facility/_components/ShowcaseTemplate";
import { buildFacilityMetadata } from "@/app/(web)/facility/_data/metadata";
import { DiscoveryTemplate, getDiscoveryMetadata } from "@/lib/routing/discovery";
import { resolveSlug, resolveLegacyTarget } from "@/lib/routing/resolve-slug";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;

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
    const facility = await prisma.facility.findUnique({
      where: { slug: slug[1], status: "ACTIVE" },
      select: { slug: true },
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
      select: { slug: true },
    });
    if (facility) {
      permanentRedirect(`/${facility.slug}#deals`);
    }
  }

  // /facilities/{category}/{facilitySlug} handled at edge level in next.config.ts redirects()

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
        return (
          <FacilityShowcaseTemplate
            params={Promise.resolve({
              categorySlug: resolved.category,
              facilitySlug: slug[0],
            })}
          />
        );
      }
      return (
        <DiscoveryTemplate
          params={Promise.resolve({
            categorySlug: slug[0],
          })}
        />
      );
    }
  }

  if (slug && slug.length === 2) {
    const facility = await prisma.facility.findUnique({
      where: { slug: slug[1], status: "ACTIVE" },
      select: { slug: true },
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
      select: { slug: true },
    });
    if (facility) {
      permanentRedirect(`/${facility.slug}#deals`);
    }
  }

  notFound();
}
