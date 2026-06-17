import { Suspense } from "react";
import { Metadata } from "next";
import { connection } from "next/server";
import { getDictionary } from "@/lib/dictionaries";
import { FacilityGrid } from "../_components/FacilityGrid";
import { FacilityGridSkeleton } from "../_components/FacilitySkeletons";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";
import { prisma } from "@/server/lib/prisma";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/SEO/JsonLd";

interface PageProps {
  params: Promise<{ categorySlug: string; }>;
}

/**
 * 📈 Discovery SEO Engine (Shared for native catching route)
 */
export async function getDiscoveryMetadata(categorySlug: string): Promise<Metadata> {
  const dict = await getDictionary();
  
  // 1. Check if it's a valid category
  const hasCategory = await prisma.facility.findFirst({
    where: { category: { equals: categorySlug, mode: 'insensitive' } }
  });

  if (!hasCategory) {
    notFound();
  }

  // 2. Fallback to category metadata
  const catLabels: Record<string, string> = {
    "akva-parkovi": "Akva Parkovi",
    "bazeni": "Bazeni",
    "wellness-i-spa": "Wellness i Spa"
  };
  const catName = catLabels[categorySlug.toLowerCase()] || (categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).toLowerCase());

  const canonicalUrl = `https://www.splashdeals.rs/${categorySlug}`;
  return {
    title: `${catName} u Srbiji | ${dict.facilities.best_label} Splash Deals`,
    description: `Istražite najbolju kolekciju ${catName} objekata širom Srbije. Brzo rezervišite digitalne ulaznice i uživajte bez čekanja u redu uz Splashdeals.`,
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
       title: `${catName} u Srbiji | Splashdeals`,
       description: `Istražite najbolju kolekciju ${catName} objekata širom Srbije. Brzo rezervišite digitalne ulaznice i uživajte bez čekanja u redu uz Splashdeals.`,
       images: ["/og-image.png"],
       locale: "sr_RS",
       type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${catName} u Srbiji | Splashdeals`,
      description: `Istražite najbolju kolekciju ${catName} objekata širom Srbije. Brzo rezervišite digitalne ulaznice i uživajte bez čekanja u redu uz Splashdeals.`,
      images: ["/og-image.png"],
    }
  };
}

/**
 * 🕵️ Metadata Engine (For the legacy long-segment redirect)
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connection();
  const { categorySlug } = await params;
  
  const legacyMapping: Record<string, string> = {
    "waterpark": "akva-parkovi",
    "swimming-pool": "bazeni",
    "wellness-center": "wellness-i-spa"
  };
  const target = legacyMapping[categorySlug.toLowerCase()] || categorySlug;
  const canonicalUrl = `https://www.splashdeals.rs/${target}`;
  return {
    title: `Preusmeravanje... | Splashdeals`,
    robots: { index: false, follow: true },
    alternates: { canonical: canonicalUrl },
  };
}

/**
 * 🌊 Discovery Template Component (Used natively by catching routes)
 */
export async function DiscoveryTemplate({ params }: PageProps) {
  await connection();
  const { categorySlug } = await params;
  const dict = await getDictionary();


  const hasCategory = await prisma.facility.findFirst({
    where: { category: { equals: categorySlug, mode: 'insensitive' } }
  });

  if (!hasCategory) {
    notFound();
  }

  const catLabels: Record<string, string> = {
    "akva-parkovi": "Akva Parkovi",
    "bazeni": "Bazeni",
    "wellness-i-spa": "Wellness i Spa"
  };
  const displayName = catLabels[categorySlug.toLowerCase()] || (categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).toLowerCase());
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `https://www.splashdeals.rs/${categorySlug}#webpage`,
        "name": `${dict.facilities.best_label} ${displayName} Facilities`,
        "description": `Discover the best ${displayName} offers on Splashdeals.`,
        "url": `https://www.splashdeals.rs/${categorySlug}`,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `https://www.splashdeals.rs/${categorySlug}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", "position": 1, name: "Home", item: { "@id": "https://www.splashdeals.rs", name: "Home" } },
          { "@type": "ListItem", "position": 2, name: displayName, item: { "@id": `https://www.splashdeals.rs/${categorySlug}`, name: displayName } },
        ],
      },
    ],
  };
  
  return (
    <div className="min-h-screen pb-32 pt-16 px-6 sm:px-12 max-w-7xl mx-auto">
      <JsonLd data={jsonLd} />

      {/* 🧭 BREADCRUMBS */}
      <nav className="mb-12">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">{dict.nav.home}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="capitalize text-cyan-500 font-bold">{displayName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </nav>

      {/* 🏙️ DISCOVERY HEADER */}
      <header className="mb-20">
         <div 
           className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12"
         >
            <div className="max-w-3xl">
               <span className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4 block animate-pulse">
                {dict.facilities.category_discovery}
               </span>
               <h1 className="text-5xl sm:text-8xl font-black tracking-tighter uppercase italic leading-[0.85] text-white">
                 {dict.facilities.best_label} <br/> <span className="text-splash capitalize">{displayName}</span> {dict.facilities.facilities_label}
               </h1>
            </div>
         </div>
      </header>

      {/* 🚀 FACILITIES GRID (Streaming) */}
      <section>
         <Suspense fallback={<FacilityGridSkeleton count={4} />}>
            <FacilityGrid 
              dict={dict}
              fromLabel={dict.facilities.from_price} 
              category={categorySlug}
              noFacilitiesLabel={dict.facilities.no_facilities}
            />
         </Suspense>
      </section>
    </div>
  );
}

/**
 * 🌊 Legacy Page Entry (Triggers HTTP 301 Permanent Redirect)
 */
export default async function DiscoveryPage(_props: PageProps) {
  await connection();
  // This page is never rendered in production — proxy.ts handles the redirect at edge.
  // Render minimal shell to satisfy prerender.
  return <div />;
}
