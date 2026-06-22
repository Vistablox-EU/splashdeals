import { Icon } from "@/components/ui/Icon";
import { notFound, permanentRedirect } from "next/navigation"
import { Metadata } from "next"
import { prisma } from "@/server/lib/prisma"
import Link from "next/link"
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
  OperatingHours, 
  DayType,
  TimeSlot,
  Prisma
} from "@prisma/client"

// 🏝️ Islands: Client Components for interactive portions
import { ShowcaseHero, WeatherBadge } from "./_components/ShowcaseHero"
import { FaqAccordion } from "./_components/FaqAccordion"
import { OperationalPortal, CurrentOperationalStatus } from "./_components/OperationalPortal"
import { WeatherBadgeSkeleton, OperationalStatusSkeleton, TicketGridSkeleton } from "./_components/ShowcaseSkeletons"
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

const DistanceCalculator = dynamic(() => import("./_components/DistanceCalculator").then((mod) => mod.DistanceCalculator), {
  loading: () => <div className="h-10 w-36 rounded-2xl bg-muted border border-border" />,
});

const MobileUnifiedControlPill = dynamic(() => import("./_components/MobileUnifiedControlPill").then((mod) => mod.MobileUnifiedControlPill), {
  loading: () => <div className="h-16 w-full max-w-md mx-auto rounded-full bg-muted border border-border" />,
});

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PartnerBranding } from "./_components/PartnerBranding"
import { SidebarWeatherWidget } from "./_components/WeatherWidget"
import { ScrollManager } from "./_components/ScrollManager"
import { BreadcrumbInjector } from "./_components/BreadcrumbInjector"


import { serialize } from "@/lib/serialize"
import { ShareButton } from "./_components/ShareButton"
import { JsonLd } from "@/components/SEO/JsonLd"
import { validateDiscoverySlug } from "@/server/lib/data/discovery";
import { calculateMaxDiscount } from "@/lib/utils/pricing";
import { 
  catLabelMap,
  buildAttractionSchema, 
  buildBusinessSchema, 
  buildProductSchema, 
  buildVideoSchema, 
  buildBreadcrumbSchema
} from "./_schemas";

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
 * 🔒 Reusable cached fetcher forperformance and consistency
 */
async function getFacility(slug: string): Promise<Prisma.FacilityGetPayload<{
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
              orderBy: { displayOrder: "asc" }
            }
          },
          orderBy: { displayOrder: "asc" }
        }
      },
      orderBy: { displayOrder: "asc" }
    },
    policy: true,
    hours: { orderBy: { dayOfWeek: "asc" } },
    amenities: { include: { amenity: true }, orderBy: { displayOrder: "asc" } },
    marketplaceCities: { include: { city: true } },
    faqs: { orderBy: { displayOrder: "asc" } },
  }
}> | null> {
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
                orderBy: { displayOrder: "asc" }
              }
            },
            orderBy: { displayOrder: "asc" }
          }
        },
        orderBy: { displayOrder: "asc" }
      },
      policy: true,
      hours: { orderBy: { dayOfWeek: "asc" } },
      amenities: { include: { amenity: true }, orderBy: { displayOrder: "asc" } },
      marketplaceCities: { include: { city: true } },
      faqs: { orderBy: { displayOrder: "asc" } },
    }
  });

  if (result) {
    return serialize(result);
  }
  return null;
}

/**
 * 🕵️ Metadata Engine (Shared for native showcase page)
 */
export async function getFacilityMetadata(facilitySlug: string, categorySlug: string, subPath?: string): Promise<Metadata> {
  const facility = await getFacility(facilitySlug)
  if (!facility) {
    notFound()
  }

  const currentYear = new Date().getFullYear();
  const categoryLabel = catLabelMap[facility.category.toLowerCase()] ?? facility.category;

  // Derive ticket data from new hierarchy (ticketCategories → types → prices)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tickets = (facility.ticketCategories || []).flatMap((cat: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cat.types || []).flatMap((prod: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prod.prices || []).filter((p: any) => p.isActive)
    )
  );
  const activeTickets = tickets;
  const ticketCount = activeTickets.length;
  const ticketHint = ticketCount > 0 
    ? ` | ${ticketCount} vrsta ulaznica dostupno`
    : '';

  const minPrice = activeTickets.length > 0 
    ? Math.min(...activeTickets.map((t: { price: number | { toString: () => string } }) => Number(t.price)))
    : null;

  const priceHint = minPrice 
    ? ` Već od ${minPrice} RSD!`
    : '';

  // Prioritize metaTitle from database, fall back to dynamic formula
  const maxDiscount = calculateMaxDiscount(
    tickets.map((t: { isActive: boolean; price: unknown; originalPrice: unknown | null }) => ({
      isActive: t.isActive,
      price: Number(t.price),
      originalPrice: t.originalPrice ? Number(t.originalPrice) : null,
    }))
  );
  
  // Localize and normalize the facility name (e.g. "AquaPark Petroland" -> "Akva park Petroland")
  const localizedName = facility.name
    .replace(/\bAquaPark\b/gi, "Akva park")
    .replace(/\bAqua Park\b/gi, "Akva park");

  const fallbackTitle = maxDiscount > 0
    ? `${localizedName} ${facility.city} Ulaznice - Uštedi do ${maxDiscount}%`
    : `${localizedName} ${facility.city} Ulaznice ${currentYear}`;
  
  const rawTitle = facility.metaTitle || fallbackTitle;
  
  // Clean up trailing brand suffixes to prevent the root layout template from duplicating the brand name
  const title = rawTitle
    .replace(/\s*\|\s*Splash\s*Deals\s*$/i, "")
    .replace(/\s*\|\s*Splashdeals\s*$/i, "");

  // Prioritize metaDescription from database, fall back to dynamic formula
  const fallbackDescription = `Kupi ulaznice za ${facility.name} u ${facility.city}.${priceHint} Najbolje cene za ${categoryLabel.toLowerCase()} u Srbiji na Splashdeals.`;
  const baseDescription = facility.metaDescription || (facility.description?.slice(0, 140) || fallbackDescription);
  const finalDescription = baseDescription.includes("Već od") ? baseDescription : `${baseDescription}${priceHint}${ticketHint}`;

  const ogImage = facility.media.find((m: { isHero: boolean; isCardBackground: boolean; type: string; url?: string }) => m.isHero && m.type === 'PHOTO')?.url 
    || facility.media.find((m: { isHero: boolean; isCardBackground: boolean; type: string; url?: string }) => m.isCardBackground && m.type === 'PHOTO')?.url
    || facility.media.find((m: { isHero: boolean; isCardBackground: boolean; type: string; url?: string }) => m.type === 'PHOTO')?.url
    || "/og-image.png";

  const canonicalUrl = subPath 
    ? `https://www.splashdeals.rs/${facilitySlug}/${subPath}`
    : `https://www.splashdeals.rs/${facilitySlug}`;

  return {
    title,
    description: finalDescription,
    // Explicit index directive — must arrive in the same chunk as the canonical tag.
    // Never rely on the loading skeleton's absence of noindex; declare it positively.
    robots: { index: true, follow: true },
    alternates: { 
      canonical: canonicalUrl,
      languages: {
        "sr-RS": canonicalUrl,
        "sr": canonicalUrl,
        "x-default": canonicalUrl,
      }
    },
    openGraph: {
      title,
      description: finalDescription,
      url: canonicalUrl,
      siteName: "SplashDeals",
      images: [{ url: ogImage, width: 1200, height: 630, alt: facility.name }],
      locale: "sr_RS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: finalDescription,
      images: [ogImage],
    }
  }
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

async function WeatherBadgeIsland({ lat, lng }: { lat: number, lng: number }) {
  let weather = null;
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`, { 
      next: { revalidate: 3600 } 
    })
    const data = await res.json()
    weather = data.current_weather
  } catch { 
    weather = null;
  }
  if (!weather) return null;
  return <WeatherBadge weather={weather} />
}

async function SidebarWeatherIsland({ lat, lng }: { lat: number, lng: number }) {
  let weather = null;
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`, { 
      next: { revalidate: 3600 } 
    })
    const data = await res.json()
    weather = data.current_weather
  } catch { 
    weather = null;
  }
  if (!weather) return null;
  return <SidebarWeatherWidget weather={weather} />
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

  // Fetch weather data for the unified mobile pill
  let weather = null;
  let dailyForecast = null;
  if (facility.lat && facility.lng) {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${facility.lat}&longitude=${facility.lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`,
        { next: { revalidate: 3600 } }
      );
      const data = await res.json();
      weather = data.current_weather;
      if (data.daily) {
        const dayNames = ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"];
        dailyForecast = data.daily.time.map((dateStr: string, i: number) => ({
          day: dayNames[new Date(dateStr).getDay()],
          weathercode: data.daily.weathercode[i],
          tempHigh: Math.round(data.daily.temperature_2m_max[i]),
          tempLow: Math.round(data.daily.temperature_2m_min[i]),
        }));
      }
    } catch {
      weather = null;
    }
  }

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
  const allTiers = mappedGroups.flatMap((group: { tiers: Array<unknown> }) => group.tiers || []);

  // Deterministic ratings removed — AggregateRating requires real user reviews,
  // not values computed from facility name hashes. Remove once a review system exists.

  // Dynamic Wikidata entity mapping for advanced generative search engines (GEO)
  const additionalType = facility.category.toLowerCase() === 'waterpark' 
    ? "https://www.wikidata.org/wiki/Q740331" 
    : facility.category.toLowerCase() === 'swimming-pool' 
      ? "https://www.wikidata.org/wiki/Q64528" 
      : "https://www.wikidata.org/wiki/Q11947";

  const aggregateOffer = allTiers.length > 0 ? {
    "@type": "AggregateOffer",
    "priceCurrency": "RSD",
    "lowPrice": Math.min(...allTiers.map((t) => Number((t as { price: number }).price))),
    "highPrice": Math.max(...allTiers.map((t) => Number((t as { price: number }).price))),
    "offerCount": allTiers.length,
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": 0,
        "priceCurrency": "RSD"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": {
          "@type": "QuantitativeValue",
          "maxValue": 0,
          "unitCode": "DAY"
        }
      }
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "RS",
      "returnPolicyCategory": "https://schema.org/NoReturns"
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "offers": allTiers.map((tier: any) => {
      const hasDiscount = tier.originalPrice && Number(tier.originalPrice) > Number(tier.price);
      
      const priceSpecification = hasDiscount ? [
        {
          "@type": "UnitPriceSpecification",
          "priceType": "https://schema.org/ListPrice",
          "price": Number(tier.originalPrice),
          "priceCurrency": "RSD",
          "valueAddedTaxIncluded": true
        },
        {
          "@type": "UnitPriceSpecification",
          "priceType": "https://schema.org/SalePrice",
          "price": Number(tier.price),
          "priceCurrency": "RSD",
          "valueAddedTaxIncluded": true
        }
      ] : [
        {
          "@type": "UnitPriceSpecification",
          "priceType": "https://schema.org/ListPrice",
          "price": Number(tier.price),
          "priceCurrency": "RSD",
          "valueAddedTaxIncluded": true
        }
      ];

      const saleEndDate = tier.saleEnd ? new Date(tier.saleEnd) : null;
      const priceValidUntil = saleEndDate && !isNaN(saleEndDate.getTime())
        ? saleEndDate.toISOString().slice(0, 10)
        : `${currentYear}-12-31`;

      const saleStartDate = tier.saleStart ? new Date(tier.saleStart) : null;
      const availabilityStarts = saleStartDate && !isNaN(saleStartDate.getTime())
        ? saleStartDate.toISOString().slice(0, 10)
        : null;

      const saleEndDateVal = tier.saleEnd ? new Date(tier.saleEnd) : null;
      const availabilityEnds = saleEndDateVal && !isNaN(saleEndDateVal.getTime())
        ? saleEndDateVal.toISOString().slice(0, 10)
        : null;

      return {
        "@type": "Offer",
        "@id": `https://www.splashdeals.rs/${facilitySlug}#ticket-${tier.id}`,
        "name": tier.label,
        "price": Number(tier.price),
        "priceCurrency": "RSD",
        "priceSpecification": priceSpecification,
        "priceValidUntil": priceValidUntil,
        "availability": tier.isActive ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "url": `https://www.splashdeals.rs/${facilitySlug}#ticket-${tier.id}`,
        "acceptedPaymentMethod": [
          {"@type": "PaymentMethod", "@id": "https://schema.org/CreditCard"},
          {"@type": "PaymentMethod", "@id": "https://schema.org/PaymentMethodTypeWallet"}
        ],
        ...(availabilityStarts ? { "availabilityStarts": availabilityStarts } : {}),
        ...(availabilityEnds ? { "availabilityEnds": availabilityEnds } : {}),
        ...(tier.minPeople || tier.maxPeople ? {
          "eligibleQuantity": {
            "@type": "QuantitativeValue",
            ...(tier.minPeople ? { "minValue": Number(tier.minPeople) } : {}),
            ...(tier.maxPeople ? { "maxValue": Number(tier.maxPeople) } : {})
          }
        } : {}),
        "seller": {
          "@type": "Organization",
          "name": "Splashdeals",
          "url": "https://www.splashdeals.rs"
        },
        "provider": {
          "@type": "LocalBusiness",
          "name": facility.name,
          ...(facility.media?.[0]?.url ? { image: facility.media[0].url } : {}),
          priceRange: "RSD",
          ...(facility.publicPhone ? { telephone: facility.publicPhone } : {}),
          "address": {
            "@type": "PostalAddress",
            "streetAddress": `${facility.streetName} ${facility.streetNumber}`,
            "addressLocality": facility.city,
            "postalCode": facility.postalCode,
            "addressCountry": "RS"
          }
        }
      };
    })
  } : null;

  const videoThumbnailFallback = facility.media.find((m: { type: string; isHero: boolean; isCardBackground: boolean }) => m.type === 'PHOTO' && m.isHero)?.url
    || facility.media.find((m: { type: string; isHero: boolean; isCardBackground: boolean }) => m.type === 'PHOTO' && m.isCardBackground)?.url
    || facility.media.find((m: { type: string; isHero: boolean; isCardBackground: boolean }) => m.type === 'PHOTO')?.url
    || "/og-image.png";

  const videoThumbnail = heroMedia?.thumbnailUrl || videoThumbnailFallback;

  const operatingHours = facility.hours?.map((h: OperatingHours) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Sunday", "Monday", "Tuesday", "Wednesday", 
      "Thursday", "Friday", "Saturday"
    ][h.dayOfWeek],
    opens: h.openTime,
    closes: h.closeTime,
  })) || [];

  const facilitySchema = {
    "@context": "https://schema.org",
    "@graph": [
      buildAttractionSchema(facility, facilitySlug, operatingHours),
      buildBusinessSchema(facility, facilitySlug, !!aggregateOffer),
      buildProductSchema(facility, facilitySlug, aggregateOffer, ticketCount, additionalType),
      buildVideoSchema(facility, facilitySlug, heroMedia, videoThumbnail),
      buildBreadcrumbSchema(facility, facilitySlug, categorySlug, categoryLabel)
    ].filter(Boolean),
  };

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
              {/* 📱 MOBILE SHARE ROW */}
              <div className="flex md:hidden items-center justify-end">
                 <ShareButton
                    title={facility.name}
                    url={`https://www.splashdeals.rs/${facilitySlug}`}
                 />
               </div>

              {/* 🧭 DESKTOP ACTIONS */}
              <div className="hidden md:flex flex-wrap gap-2 items-center">
                <Link href={`/${categorySlug}`} className="px-4 py-2 rounded-full backdrop-blur-xl bg-white/5 text-xs font-black flex items-center gap-2 hover:bg-white/10 transition-all border border-border uppercase tracking-widest text-muted-foreground">
                   <Icon name="arrow_back" className="text-[12px]" /> Nazad
                </Link>
                <ShareButton 
                   title={facility.name} 
                   url={`https://www.splashdeals.rs/${facilitySlug}`} 
                />
                 <div className="hidden md:block">
                    <Suspense fallback={<WeatherBadgeSkeleton />}>
                       {facility.lat && facility.lng && (
                          <WeatherBadgeIsland lat={Number(facility.lat)} lng={Number(facility.lng)} />
                       )}
                    </Suspense>
                 </div>
              </div>

               <h1 className="text-4xl md:text-7xl font-black leading-[0.8] tracking-tighter text-white italic py-2">
               {facility.name.split(' ').map((word: string, i: number) => (
                 <span key={i} className={i === 1 ? "text-splash" : ""}>{word} </span>
               ))}
             </h1>

             <div className="flex flex-wrap items-center gap-6 text-slate-300 font-bold pb-4 w-full">
                <div className="hidden md:flex items-center gap-2 bg-muted/50 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-border">
                   <Icon name="location_on" className="text-[16px] text-cyan-400" />
                   <span className="text-sm tracking-tight font-medium opacity-80">{facility.streetName} {facility.streetNumber}, {facility.postalCode} {facility.city}</span>
                </div>
                <div className="hidden md:block">
                   <Suspense fallback={<OperationalStatusSkeleton />}>
                      <CurrentOperationalStatus hours={facility.hours} />
                   </Suspense>
                </div>
                <div className="hidden md:block">
                   <Suspense fallback={<div className="h-10 w-36 rounded-2xl bg-muted border border-border" />}>
                   {facility.lat && facility.lng && (
                      <DistanceCalculator 
                         destLat={Number(facility.lat)} 
                         destLng={Number(facility.lng)} 
                         facilityName={facility.name} 
                      />
                   )}
                   </Suspense>
                </div>
                <div className="block md:hidden w-full pt-2">
                   <MobileUnifiedControlPill 
                      weather={weather}
                      dailyForecast={dailyForecast}
                      hours={facility.hours}
                      destLat={Number(facility.lat)}
                      destLng={Number(facility.lng)}
                      facilityName={facility.name}
                   />
                </div>

                {/* Mobile: Scroll-to-tickets CTA */}
                <div className="block md:hidden w-full pt-4">
                  <button
                    onClick={() => document.getElementById("tickets")?.scrollIntoView({ behavior: "smooth" })}
                    className="w-full h-14 bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-[0.97] transition-all"
                  >
                    <span>Uzmi karte</span>
                    <Icon name="arrow_downward" className="text-[16px]" />
                  </button>
                </div>
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
                 <p className="text-muted-foreground text-xl leading-relaxed font-medium italic opacity-90 max-w-2xl space-y-4">
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
              
              {/* Sidebar Weather Widget — hidden on mobile (already in MobileUnifiedControlPill) */}
              <div className="hidden md:block">
              {facility.lat && facility.lng && (
                 <Suspense fallback={<Skeleton className="h-[250px] rounded-[2.5rem] bg-white/5" />}>
                    <SidebarWeatherIsland lat={Number(facility.lat)} lng={Number(facility.lng)} />
                 </Suspense>
              )}
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
