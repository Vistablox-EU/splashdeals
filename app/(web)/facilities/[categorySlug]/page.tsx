import { Suspense } from "react";
import { Metadata } from "next";
import { connection } from "next/server";
import { getDictionary } from "@/lib/dictionaries";
import { FacilityGrid } from "../_components/FacilityGrid";
import { FacilityGridSkeleton } from "../_components/FacilitySkeletons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { prisma } from "@/server/lib/prisma";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/SEO/JsonLd";

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
export default async function DiscoveryPage(_props: PageProps) {
  await connection();
  return <div />;
}
