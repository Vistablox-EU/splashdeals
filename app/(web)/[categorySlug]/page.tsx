import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/server/lib/prisma";
import { FacilityShowcaseTemplate, getFacilityMetadata } from "@/app/(web)/facilities/[categorySlug]/[facilitySlug]/page";
import { DiscoveryTemplate, getDiscoveryMetadata } from "@/lib/routing/discovery";

const KNOWN_CATEGORIES: Record<string, string> = {
  "akva-parkovi": "Akva parkovi",
  "bazeni": "Bazeni",
  "wellness-i-spa": "Wellness i spa",
};

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;

  // 1. Try as known category
  if (KNOWN_CATEGORIES[categorySlug.toLowerCase()]) {
    return await getDiscoveryMetadata(categorySlug);
  }

  // 2. Try as category in DB
  const hasCategory = await prisma.facility.findFirst({
    where: { category: { equals: categorySlug, mode: "insensitive" } },
    select: { id: true },
  }).catch(() => null);

  if (hasCategory) {
    return await getDiscoveryMetadata(categorySlug);
  }

  // 3. Try as facility slug
  const facility = await prisma.facility.findUnique({
    where: { slug: categorySlug, status: "ACTIVE" },
    select: { slug: true, category: true },
  }).catch(() => null);

  if (facility) {
    return await getFacilityMetadata(categorySlug, facility.category!.toLowerCase().replace(/\s+/g, "-"));
  }

  notFound();
}

export default async function CategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;

  // 1. Try as category
  if (KNOWN_CATEGORIES[categorySlug.toLowerCase()]) {
    return (
      <DiscoveryTemplate
        params={Promise.resolve({ categorySlug })}
      />
    );
  }

  const hasCategory = await prisma.facility.findFirst({
    where: { category: { equals: categorySlug, mode: "insensitive" } },
    select: { id: true },
  }).catch(() => null);

  if (hasCategory) {
    return (
      <DiscoveryTemplate
        params={Promise.resolve({ categorySlug })}
      />
    );
  }

  // 3. Try as facility slug
  const facility = await prisma.facility.findUnique({
    where: { slug: categorySlug, status: "ACTIVE" },
    select: { slug: true, category: true },
  }).catch(() => null);

  if (facility) {
    return (
      <FacilityShowcaseTemplate
        params={Promise.resolve({
          categorySlug: facility.category!.toLowerCase().replace(/\s+/g, "-"),
          facilitySlug: categorySlug,
        })}
      />
    );
  }

  notFound();
}
