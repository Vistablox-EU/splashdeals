import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";

import { connection } from "next/server";

export async function generateMetadata({ params: _params }: { params: Promise<Record<string, never>> }): Promise<Metadata> {
  
  const dict = await getDictionary();
  return {
    title: dict.seo?.search?.title || "Pretraga",
    description: dict.seo?.search?.description || "Pronađite najbolje akva parkove, bazene i spa centre u Srbiji.",
    robots: { index: false, follow: false },
  };
}

/**
 * 🕵️ Intercepted Search Page
 * Captures navigation to /search and renders the GlobalSearch palette 
 * within the @modal slot of the layout, preserving background state.
 */
export default async function InterceptedSearchPage({
  params: _params,
}: {
  params: Promise<Record<string, never>>
}) {
  await connection();
  return <GlobalSearch />;
}
