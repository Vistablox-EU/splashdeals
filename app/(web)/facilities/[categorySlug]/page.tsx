import { Metadata } from "next";
import { connection } from "next/server";

// Re-export shared discovery functions from lib/routing
export { getDiscoveryMetadata, DiscoveryTemplate } from "@/lib/routing/discovery";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

const legacyMapping: Record<string, string> = {
  "waterpark": "akva-parkovi",
  "swimming-pool": "bazeni",
  "wellness-center": "wellness-i-spa",
};

/**
 * 🕵️ Metadata Engine (For the legacy long-segment redirect)
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connection();
  const { categorySlug } = await params;

  const target = legacyMapping[categorySlug.toLowerCase()] || categorySlug;
  const canonicalUrl = `https://www.splashdeals.rs/${target}`;
  return {
    title: `Preusmeravanje... | Splashdeals`,
    robots: { index: false, follow: true },
    alternates: { canonical: canonicalUrl },
  };
}

/**
 * 🌊 Legacy Page Entry (Triggers HTTP 301 Permanent Redirect)
 * This page is never rendered in production — proxy.ts handles the redirect at edge.
 */
export default async function DiscoveryPage() {
  await connection();
  return <div />;
}
