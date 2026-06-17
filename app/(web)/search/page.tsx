import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Metadata } from "next";
import { JsonLd } from "@/components/SEO/JsonLd";
import { Suspense } from "react";

import { connection } from "next/server";
import { getDictionary } from "@/lib/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, never>>;
}): Promise<Metadata> {
  const dict = await getDictionary();
  const title = dict.seo?.search?.title || "Pretraga Akva Parkova";
  const description = dict.seo?.search?.description || "Pronađite najbolje akva parkove, bazene i spa centre u Srbiji.";
  return {
    title,
    description,
    alternates: { canonical: "https://www.splashdeals.rs/search" },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      locale: "sr_RS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/**
 * 🔍 Direct Search Page
 * Fallback for direct navigation or hard refreshes on /search.
 */
export default async function SearchPage({
  params,
}: {
  params: Promise<Record<string, never>>
}) {
  await connection();
  return (
    <div className="min-h-screen bg-[#020617]">
      <JsonLd 
        id="search-schema"
        data={{
          "@context": "https://schema.org",
          "@type": "SearchResultsPage",
          "name": "Pretraga Akva Parkova",
          "description": "Pronađite akva parkove, bazene i spa centre u Srbiji."
        }} 
      />
      <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
        <GlobalSearch />
      </Suspense>
    </div>
  );
}
