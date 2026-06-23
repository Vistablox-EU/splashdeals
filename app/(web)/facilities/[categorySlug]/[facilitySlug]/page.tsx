import { Icon } from "@/components/ui/Icon";
import { notFound, permanentRedirect } from "next/navigation"
import { Metadata } from "next"
import { connection } from "next/server"
import { Suspense } from "react"
import { getDictionary } from "@/lib/dictionaries"

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
import { 
  DayType,
  TimeSlot,
} from "@prisma/client"

// 🏝️ Islands: Client Components for interactive portions
import { ShowcaseHero } from "./_components/ShowcaseHero"
import { FaqAccordion } from "./_components/FaqAccordion"
import { OperationalPortal } from "./_components/OperationalPortal"
import { TicketGridSkeleton } from "./_components/ShowcaseSkeletons"
import { HeroActionPill } from "./_components/HeroActionPill"
import dynamic from "next/dynamic"

const ShowcaseTicketGroups = dynamic(() => import("./_components/ShowcaseTicketGroups").then((mod) => mod.ShowcaseTicketGroups), {
  loading: () => <TicketGridSkeleton />
});

const MediaGallery = dynamic(() => import("./_components/MediaGallery").then((mod) => mod.MediaGallery), {
  ssr: true
});

const ShowcaseAmenities = dynamic(() => import("./_components/ShowcaseAmenities").then((mod) => mod.ShowcaseAmenities), {
  ssr: true
});

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PartnerBranding } from "./_components/PartnerBranding"
import { ScrollManager } from "./_components/ScrollManager"
import { BreadcrumbInjector } from "./_components/BreadcrumbInjector"


import { serialize } from "@/lib/serialize"
import { JsonLd } from "@/components/SEO/JsonLd";
import { validateDiscoverySlug } from "@/server/lib/data/discovery";
import { 
  catLabelMap,
  buildFacilitySchema,
  TierEntry,
} from "./_schemas";
import { getFacility, buildFacilityMetadata } from "./_metadata";
import { getWeather } from "@/server/lib/weather";

interface _TicketData {
  id: string;
  title: string;
  price: number | { toString: () => string };
  originalPrice: number | null | { toString: () => string };
  dayType: string | null;
  timeSlot: string | null;
  minPeople: number;
  maxPeople: number | null;
  isSeasonPass: boolean;
  requiresIdentity: boolean;
  requiresPhoto: boolean;
  groupId: string | null;
  isActive: boolean;
  imageUrl?: string | null;
}

interface FacilityPageProps {
  params: Promise<{
    categorySlug: string
    facilitySlug: string
  }>
}

/**
 * 🕵️ Metadata Engine (For the legacy long-segment redirect)
 */
export async function generateMetadata({ params }: FacilityPageProps): Promise<Metadata> {
  await connection()
  const { facilitySlug } = await params

  // Permanently deleted legacy paths — 410 Gone
  if (isDeletedFacility(facilitySlug)) {
    return {
      title: "Page Deleted",
      robots: { index: false, follow: false },
    };
  }

  permanentRedirect(`/${facilitySlug}`)
}

/**
 * 🌊 Showcase Template Component (Used natively by catching routes)
 */
export async function FacilityShowcaseTemplate({ params }: FacilityPageProps) {
  const { facilitySlug, categorySlug } = await params
  const currentYear = new Date().getFullYear()
  const dict = await getDictionary()
  
  const facility = await getFacility(facilitySlug)

  if (!facility) return notFound()

  // 🛡️ PRERENDER SIGNAL: Everything below this can be dynamic (PPR)
  await connection();

  validateDiscoverySlug(categorySlug, facility);
  const categoryLabel = catLabelMap[facility.category.toLowerCase()] ?? facility.category;

  // Find all active prices across all categories/products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPrices = (facility.ticketCategories || []).flatMap((cat: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cat.types || []).flatMap((prod: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prod.prices || []).filter((p: any) => p.isActive).map((p: any) => ({
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
  const ticketCount = allPrices.length;

  let mappedGroups: Array<{
    id: string;
        title: string;
    description: string | null;
    slug: string;
    tiers: Array<{
      id: string;
      slug: string | null;
      label: string;
      title: string;
      description: string | null;
      price: number;
      originalPrice: number | null;
      minPeople: number;
      maxPeople: number | null;
      dayType: DayType | null;
      timeSlot: TimeSlot | null;
      isSeasonPass: boolean;
      isActive: boolean;
      seasonStart: Date | null;
      seasonEnd: Date | null;
      requiresIdentity: boolean;
      requiresPhoto: boolean;
      imageUrl: string | null;
    }>;
  }> = []

  // Build groups from the new hierarchy — each category becomes a group,
  // each product becomes a tier (modal handles price selection)
  if (facility.ticketCategories && facility.ticketCategories.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mappedGroups = facility.ticketCategories.map((cat: any) => ({
      id: cat.id,
      title: cat.title,
      description: null,
      slug: cat.slug || cat.title.toLowerCase().replace(/\s+/g, "-"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tiers: (cat.types || []).filter((prod: any) => prod.isActive).map((prod: any) => ({
        id: prod.id,
        title: prod.title,
        label: prod.title,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        price: Math.min(...(prod.prices || []).filter((p: any) => p.isActive).map((p: any) => Number(p.price))),
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
    }))
  } else if (allPrices.length > 0) {
    // Fallback: all prices in a single "Standardne Ponude" group
    mappedGroups = [{
      id: "default-group",
      title: "Standardne Ponude",
      description: "Standardne ponude i ulaznice koje nisu deo posebnih paketa.",
      slug: "standardne-ponude",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tiers: allPrices.map((p: any) => ({
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
    }]
  }

  // 🎥 Logic: Priority Hero Selection (Protocol)
  const explicitHero = facility.media.find((m: { isHero: boolean }) => m.isHero);
  const firstVideo = facility.media.find((m: { type: string }) => m.type === "VIDEO");
  const heroMedia = explicitHero || firstVideo || facility.media[0];

  // 🧠 Structured Data Block
  const allTiers = mappedGroups.flatMap((group: { tiers: Array<unknown> }) => group.tiers || []) as TierEntry[];

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
  const weather = facility.lat && facility.lng
    ? await getWeather(Number(facility.lat), Number(facility.lng))
    : null;

  return (
    <div className="relative min-h-screen text-foreground selection:bg-primary/30 font-sans">
      
      {/* ✅ Scroll Anchor Manager */}
      <ScrollManager />
      
      {/* ✅ Structured Data */}
      <JsonLd data={facilitySchema} id={`facility-${facilitySlug}-schema`} />
      
      {/* 🧭 Breadcrumb Injector — feeds breadcrumb data into the global Header sub-row (mobile only) */}
      <BreadcrumbInjector
        items={[
          { label: "Početna", href: "/" },
          { label: categoryLabel, href: `/${categorySlug}` },
          { label: facility.name },
        ]}
        backHref={`/${categorySlug}`}
      />

      <section className="relative h-[60vh] md:h-screen w-full flex flex-col justify-end p-6 md:p-12 overflow-hidden">
        <ShowcaseHero heroMedia={heroMedia} facility={facility} />

        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-12">
           <div className="md:col-span-8 space-y-6">
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

               <h1 className="text-4xl md:text-7xl font-black leading-[0.8] tracking-tighter text-white italic py-2">
               {facility.name.split(' ').map((word: string, i: number) => (
                 <span key={i} className={i === 1 ? "text-splash" : ""}>{word} </span>
               ))}
             </h1>

             </div>
             </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 md:px-12 -mt-16 md:mt-20 relative z-20 space-y-12 sm:space-y-32 pb-24 sm:pb-48">
        <div id="deals" className="space-y-8 sm:space-y-12 scroll-mt-32">
           <div className="flex flex-col items-center text-center space-y-4 mb-8 sm:mb-16">
              <div className="brand-divider w-16 mb-2" />
              <h2 className="text-2xl md:text-5xl font-black italic tracking-tighter uppercase text-foreground leading-none">
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
               />
            </Suspense>
        </div>

        {/* 🍱 Bento Experience Sections */}
        <div id="overview" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           <div className="lg:col-span-8 space-y-8">
              {/* Main Text Card */}
              <Card className="p-6 sm:p-12 md:p-16 space-y-8 min-h-0 md:min-h-[400px] flex flex-col justify-center brand-card">
                 <div className="hidden md:flex items-center gap-3 text-primary font-black uppercase tracking-[0.2em] text-xs">
                    <Icon name="auto_awesome" className="text-[16px]" /> Iskustvo
                 </div>
                 <div className="hidden md:block brand-divider w-24 mb-4" />
                 <h2 className="hidden md:block text-2xl md:text-5xl font-black italic tracking-tighter uppercase leading-tight text-foreground">
                    Zabava <span className="text-splash">Otključana.</span>
                 </h2>
                 <p className="text-muted-foreground text-sm md:text-xl leading-relaxed font-medium italic opacity-90 max-w-2xl space-y-4">
                    <span>{facility.description || "Otkrijte premium iskustvo koje prevazilazi običan odlazak na bazen."}</span>
                    {facility.amenities && facility.amenities.length > 0 && (
                      <span className="block text-base not-italic font-medium text-slate-400 mt-4 border-t border-border/30 pt-4">
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
                <Card className="p-8 mt-8 border-l-4 border-l-primary bg-muted/50">
                   <div className="flex items-center gap-3 mb-4 text-cyan-400 font-black uppercase tracking-widest text-xs">
                      <Icon name="location_on" className="text-[16px]" /> Kako stići
                   </div>
                   <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed font-medium">
                      {facility.transitGuide}
                   </p>
                </Card>
              )}

              {/* 🍱 Facility amenities card grid — hidden on mobile, already in description text */}
              <div className="hidden md:block">
              <ShowcaseAmenities 
                amenities={serialize(facility.amenities) as any /* eslint-disable-line @typescript-eslint/no-explicit-any */} 
                dict={dict} 
              />
              </div>
           </div>

           <aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
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
          <div className="space-y-8 pt-8 max-w-3xl mx-auto w-full px-6 md:px-12 bg-brand-amber-subtle rounded-3xl py-8">
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
           <article className="max-w-5xl mx-auto px-6 py-12 text-muted-foreground text-xs text-center border-t border-border mt-24">
              <div className="whitespace-pre-line leading-relaxed">
                 {facility.seoArticle}
              </div>
           </article>
        )}
      </main>
    </div>
  )
}

/**
 * 🌊 Legacy Page Entry (Triggers HTTP 301 Permanent Redirect)
 * Unless it's a permanently deleted path — then 410 Gone.
 */
export default async function FacilityShowcasePage({ params }: FacilityPageProps) {
  await connection();
  const { facilitySlug } = await params

  // Permanently deleted legacy paths — 410 Gone
  if (isDeletedFacility(facilitySlug)) {
    return (
      <html lang="sr">
        <head>
          <meta name="robots" content="noindex, nofollow" />
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style={{ background: "#020617", color: "#94a3b8", fontFamily: "sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "6rem", fontWeight: 900, color: "#06b6d4", margin: 0 }}>410</div>
            <p style={{ fontSize: "1.25rem", marginTop: "0.5rem" }}>This page has been permanently deleted.</p>
          </div>
        </body>
      </html>
    );
  }

  permanentRedirect(`/${facilitySlug}`)
}
