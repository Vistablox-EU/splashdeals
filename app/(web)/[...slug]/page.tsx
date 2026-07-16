import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/app/(server)/lib/prisma";
import { FacilityShowcaseTemplate } from "@/app/(web)/facility/_components/ShowcaseTemplate";
import { buildFacilityMetadata } from "@/app/(web)/facility/_data/metadata";
import { DiscoveryTemplate, getDiscoveryMetadata } from "@/app/(server)/lib/routing/discovery";
import { resolveSlug, resolveLegacyTarget } from "@/app/(server)/lib/routing/resolve-slug";
import { parseLocaleSegments } from "@/lib/locale";
import { buildCmsPageMetadata, CmsPageTemplate } from "@/app/(web)/_components/CmsPageTemplate";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Legacy /en/ and /rs/ prefix routes → resolve final target and 301 directly
  if (slug && (slug[0] === "en" || slug[0] === "rs")) {
    const target = await resolveLegacyTarget(slug);
    if (target) permanentRedirect(target);
  }

  // Locale-aware slug resolution (e.g. /en/aqua-parks)
  const { locale, segments } = parseLocaleSegments(slug || []);

  if (segments.length === 1) {
    const resolved = await resolveSlug(segments[0], locale);
    if (resolved) {
      if (resolved.type === "facility") {
        return await buildFacilityMetadata(segments[0], resolved.category);
      }
      if (resolved.type === "page") {
        return await buildCmsPageMetadata(resolved.slug);
      }
      return await getDiscoveryMetadata(segments[0]);
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

/**
 * 🌊 Catch-All Interceptor
 * Forces all unmatched routes within the routing segment to trigger
 * the custom 404 UI located in the (web) group, while automatically
 * stripping legacy locale prefixes via direct 301 redirects (no intermediate hops),
 * or serving the dynamic prefix-free facility & category listings natively.
 * Also serves published CMS static pages when the slug does not match facility/category.
 */
export default async function CatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;

  // Legacy /en/ and /rs/ prefix routes → resolve final target and 301 directly
  if (slug && (slug[0] === "en" || slug[0] === "rs")) {
    const target = await resolveLegacyTarget(slug);
    if (target) permanentRedirect(target);
  }

  // Locale-aware slug resolution (e.g. /en/aqua-parks → render aqua-parks)
  const { locale, segments } = parseLocaleSegments(slug || []);

  if (segments.length === 1) {
    const resolved = await resolveSlug(segments[0], locale);
    if (resolved) {
      if (resolved.type === "facility") {
        return (
          <FacilityShowcaseTemplate
            params={Promise.resolve({
              categorySlug: resolved.category,
              facilitySlug: segments[0],
            })}
          />
        );
      }
      if (resolved.type === "page") {
        return <CmsPageTemplate slug={resolved.slug} />;
      }
      return (
        <DiscoveryTemplate
          params={Promise.resolve({
            categorySlug: segments[0],
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
