import { Icon } from "@/components/ui/Icon";
import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { getDictionary } from "@/lib/dictionaries";

/**
 * 🗑️ Permanently deleted legacy facility paths — return 410 Gone
 * NOTE: These are handled at the proxy layer (proxy.ts) BEFORE reaching Next.js.
 * This set is intentionally empty — do NOT add active canonical facility slugs here.
 * The proxy returns 410 for /facilities/waterpark/[slug], /waterpark/[slug], etc.
 * Adding a real slug here would cause the 410 branch to fire on the canonical URL.
 */
const DELETED_FACILITY_SLUGS = new Set<string>([]); // proxy handles all 410s

function isDeletedFacility(slug: string): boolean {
  return DELETED_FACILITY_SLUGS.has(slug);
}

// 🏝️ Islands: Client Components for interactive portions
import { ShowcaseHero } from "./_components/ShowcaseHero";
import { FaqAccordion } from "./_components/FaqAccordion";
import { OperationalPortal } from "./_components/OperationalPortal";
import { TicketGridSkeleton } from "./_components/ShowcaseSkeletons";
import { HeroActionPill } from "./_components/HeroActionPill";
import dynamic from "next/dynamic";

const ShowcaseTicketGroups = dynamic(
  () => import("./_components/ShowcaseTicketGroups").then((mod) => mod.ShowcaseTicketGroups),
  {
    loading: () => <TicketGridSkeleton />,
  },
);

const MediaGallery = dynamic(
  () => import("./_components/MediaGallery").then((mod) => mod.MediaGallery),
  {
    ssr: true,
  },
);

const ShowcaseAmenities = dynamic(
  () => import("./_components/ShowcaseAmenities").then((mod) => mod.ShowcaseAmenities),
  {
    ssr: true,
  },
);

import { PartnerBranding } from "./_components/PartnerBranding";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { serialize } from "@/lib/serialize";
import { JsonLd } from "@/components/SEO/JsonLd";
import { validateDiscoverySlug } from "@/server/lib/data/discovery";
import { getCategoryLabel, buildFacilitySchema, TierEntry } from "./_head";
import { getFacility, buildTicketGroups, flattenActivePrices } from "./_head";
import { getWeather } from "@/server/lib/weather";

interface FacilityPageProps {
  params: Promise<{
    categorySlug: string;
    facilitySlug: string;
  }>;
}

/**
 * 🕵️ Metadata Engine (For the legacy long-segment redirect)
 */
export async function generateMetadata({ params }: FacilityPageProps): Promise<Metadata> {
  const { facilitySlug } = await params;

  // Permanently deleted legacy paths — 410 Gone
  if (isDeletedFacility(facilitySlug)) {
    return {
      title: "Page Deleted",
      robots: { index: false, follow: false },
    };
  }

  permanentRedirect(`/${facilitySlug}`);
}

/**
 * 🌊 Showcase Template Component (Used natively by catching routes)
 */
export async function FacilityShowcaseTemplate({ params }: FacilityPageProps) {
  const { facilitySlug, categorySlug } = await params;
  const currentYear = new Date().getFullYear();
  const dict = await getDictionary();

  const facility = await getFacility(facilitySlug);

  if (!facility) return notFound();

  const categoryLabel = getCategoryLabel(facility.category);

  // 🕵️ Validate that the URL slug matches the facility's category or city
  validateDiscoverySlug(categorySlug, facility);

  // Build ticket groups and price data
  const mappedGroups = buildTicketGroups(facility);
  const allPrices = flattenActivePrices(facility);
  const ticketCount = allPrices.length;

  // Build a lookup map so the mobile accordion doesn't need an API call
  const ticketProductMap: Record<
    string,
    {
      id: string;
      title: string;
      label: string | null;
      minPeople: number;
      maxPeople: number | null;
      prices: Array<{
        id: string;
        label: string | null;
        price: number;
        originalPrice: number | null;
        dayType: string | null;
        timeSlot: string | null;
      }>;
    }
  > = {};
  for (const cat of facility.ticketCategories || []) {
    for (const prod of cat.types || []) {
      ticketProductMap[prod.id] = {
        id: prod.id,
        title: prod.title,
        label: prod.label,
        minPeople: prod.minPeople,
        maxPeople: prod.maxPeople,
        prices: (prod.prices || []).map((p) => ({
          id: p.id,
          label: p.label,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          dayType: p.dayType,
          timeSlot: p.timeSlot,
        })),
      };
    }
  }

  // 🎥 Logic: Priority Hero Selection (Protocol)
  const explicitHero = facility.media.find((m) => m.isHero);
  const firstVideo = facility.media.find((m) => m.type === "VIDEO");
  const heroMedia = explicitHero || firstVideo || facility.media[0];

  // 🧠 Structured Data Block
  const allTiers = mappedGroups.flatMap((group) => group.tiers || []) as TierEntry[];

  const facilitySchema = buildFacilitySchema({
    facility,
    facilitySlug,
    categorySlug,
    categoryLabel,
    allTiers,
    heroMedia: heroMedia ?? null,
    ticketCount,
    currentYear,
    hours: facility.hours ?? [],
  });

  // 🌤️ Fetch live weather from Open-Meteo (server-side, passed to client component)
  const weather =
    facility.lat && facility.lng
      ? await getWeather(Number(facility.lat), Number(facility.lng))
      : null;
  return (
    <div className="text-foreground selection:bg-primary/30 relative min-h-screen font-sans">
      {/* ✅ Structured Data */}
      <JsonLd data={facilitySchema} id={`facility-${facilitySlug}-schema`} />
      <section className="relative flex h-[60vh] w-full flex-col justify-end overflow-hidden p-6 md:min-h-[calc(100dvh-104px)] md:p-12">
        <ShowcaseHero heroMedia={heroMedia} facility={facility} />

        <div className="relative z-10 mx-auto mb-12 grid w-full max-w-7xl grid-cols-1 items-end gap-8 md:grid-cols-12">
          <div className="space-y-6 md:col-span-8">
            <HeroActionPill
              facility={{
                name: facility.name,
                slug: facility.slug,
                lat: facility.lat,
                lng: facility.lng,
                hours: facility.hours,
                streetName: facility.streetName,
                streetNumber: facility.streetNumber,
                postalCode: facility.postalCode,
                city: facility.city,
              }}
              facilitySlug={facilitySlug}
              categorySlug={categorySlug}
              weather={weather}
            />

            <h1 className="py-2 text-4xl leading-[0.8] font-black tracking-tighter text-white italic md:text-7xl">
              {(() => {
                const words = facility.name.split(" ");
                if (words.length === 1) {
                  return <span className="text-splash">{words[0]}</span>;
                }
                const last = words.length - 1;
                return words.map((word, i) => (
                  <span key={i} className={i === last ? "text-splash" : ""}>
                    {word}{" "}
                  </span>
                ));
              })()}
            </h1>
          </div>
        </div>
      </section>

      <main className="relative z-20 mx-auto -mt-16 max-w-7xl space-y-12 px-6 pb-24 sm:space-y-32 sm:pb-48 md:-mt-40 md:px-12">
        <div id="deals" className="scroll-mt-32 space-y-8 sm:space-y-12">
          <div className="mb-8 flex flex-col items-center space-y-4 text-center sm:mb-16">
            <div className="brand-divider mb-2 w-16" />
            <h2 className="text-foreground text-2xl leading-none font-black tracking-tighter uppercase italic md:text-5xl">
              Aktuelne <span className="text-splash">Ponude.</span>
            </h2>
          </div>
          <Suspense fallback={<TicketGridSkeleton />}>
            <ShowcaseTicketGroups
              groups={mappedGroups}
              facilityId={facility.id}
              facilitySlug={facility.slug}
              facilityName={facility.name}
              category={facility.category}
              facility={facility}
              ticketProductMap={serialize(ticketProductMap)}
            />
          </Suspense>
        </div>

        {/* 🍱 Bento Experience Sections */}
        <div id="overview" className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {/* Main Text Card */}
            <Card className="brand-card flex min-h-0 flex-col justify-center space-y-8 p-6 sm:p-12 md:p-16">
              <div className="text-primary hidden items-center gap-3 text-xs font-black tracking-[0.2em] uppercase md:flex">
                <Icon name="auto_awesome" className="text-[16px]" /> Iskustvo
              </div>
              <div className="brand-divider mb-4 hidden w-24 md:block" />
              <h2 className="text-foreground hidden text-2xl leading-tight font-black tracking-tighter uppercase italic md:block md:text-5xl">
                Zabava <span className="text-splash">Otključana.</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl space-y-4 text-sm leading-relaxed font-medium italic opacity-90 md:text-xl">
                <span>
                  {facility.description ||
                    "Otkrijte premium iskustvo koje prevazilazi običan odlazak na bazen."}
                </span>
                {facility.amenities && facility.amenities.length > 0 && (
                  <span className="border-border/30 mt-4 block border-t pt-4 text-base font-medium text-slate-400 not-italic md:hidden">
                    Sadržaji:{" "}
                    {facility.amenities
                      .map((fa: { amenity: { name: string } }) => fa.amenity.name)
                      .join(", ")}
                    .
                  </span>
                )}
              </p>
            </Card>

            {facility.transitGuide && (
              <Card className="border-l-primary bg-muted/50 mt-8 border-l-4 p-8">
                <div className="mb-4 flex items-center gap-3 text-xs font-black tracking-widest text-cyan-400 uppercase">
                  <Icon name="location_on" className="text-[16px]" /> Kako stići
                </div>
                <p className="text-sm leading-relaxed font-medium whitespace-pre-line text-slate-300">
                  {facility.transitGuide}
                </p>
              </Card>
            )}

            {/* 🍱 Facility amenities card grid — hidden on mobile, already in description text */}
            <div className="hidden md:block">
              <ShowcaseAmenities
                amenities={
                  serialize(facility.amenities) as unknown as Array<{
                    amenityId: string;
                    value: string | null;
                    imageUrl?: string | null;
                    scheduledAt?: string | null;
                    isFeatured?: boolean;
                    amenity: {
                      id: string;
                      name: string;
                      icon: string;
                      category: string | null;
                      type: "BOOLEAN" | "QUANTIFIABLE" | "TEXT";
                    };
                  }>
                }
                dict={dict}
              />
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-4">
            {/* Partner Branding — hidden on mobile (already in description text) */}
            <div className="hidden md:block">
              <PartnerBranding logoUrl={facility.logoUrl} name={facility.name} />
            </div>

            {/* Operational Portal — hidden on mobile (already in MobileUnifiedControlPill) */}
            <div className="hidden md:block">
              <Suspense fallback={<Skeleton className="h-[600px] rounded-[3rem] bg-white/5" />}>
                <OperationalPortal hours={facility.hours} />
              </Suspense>
            </div>
          </aside>
        </div>

        {facility.faqs && facility.faqs.length > 0 && (
          <div className="bg-brand-amber-subtle mx-auto w-full max-w-3xl space-y-8 rounded-3xl px-6 py-8 pt-8 md:px-12">
            <FaqAccordion
              faqs={facility.faqs.map((f) => ({
                id: f.id,
                question: f.question,
                answer: f.answer,
              }))}
            />
          </div>
        )}

        <MediaGallery media={facility.media} dict={dict} />

        {facility.seoArticle && (
          <article className="text-muted-foreground border-border mx-auto mt-24 max-w-5xl border-t px-6 py-12 text-center text-xs">
            <div className="leading-relaxed whitespace-pre-line">{facility.seoArticle}</div>
          </article>
        )}
      </main>
    </div>
  );
}

/**
 * 🌊 Legacy Page Entry (Triggers HTTP 301 Permanent Redirect)
 * Unless it's a permanently deleted path — then 410 Gone.
 */
export default async function FacilityShowcasePage({ params }: FacilityPageProps) {
  const { facilitySlug } = await params;

  // Permanently deleted legacy paths — 410 Gone
  if (isDeletedFacility(facilitySlug)) {
    return (
      <html lang="sr">
        <head>
          <meta name="robots" content="noindex, nofollow" />
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body
          style={{
            background: "#020617",
            color: "#94a3b8",
            fontFamily: "sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            margin: 0,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "6rem", fontWeight: 900, color: "#06b6d4", margin: 0 }}>
              410
            </div>
            <p style={{ fontSize: "1.25rem", marginTop: "0.5rem" }}>
              This page has been permanently deleted.
            </p>
          </div>
        </body>
      </html>
    );
  }

  permanentRedirect(`/${facilitySlug}`);
}
