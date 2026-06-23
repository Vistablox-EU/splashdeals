import { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/server/lib/prisma";
import { FacilityShowcaseTemplate } from "@/app/(web)/facilities/[categorySlug]/[facilitySlug]/page";
import { buildFacilityMetadata } from "@/app/(web)/facilities/[categorySlug]/[facilitySlug]/_metadata";
import { DiscoveryTemplate, getDiscoveryMetadata } from "@/lib/routing/discovery";
import { slugToDbValue, isKnownCategory, dbValueToSlug } from "@/lib/routing/categories";

interface PageProps {
  params: Promise<{ categorySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;

  // 1. Try as known category
  if (isKnownCategory(categorySlug.toLowerCase())) {
    return await getDiscoveryMetadata(categorySlug);
  }

  // 2. Try as category in DB
  const dbValue = slugToDbValue(categorySlug);
  const hasCategory = await prisma.facility.findFirst({
    where: { category: { equals: dbValue ?? categorySlug, mode: "insensitive" } },
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
    const catSlug = dbValueToSlug(facility.category!) ?? facility.category!.toLowerCase().replace(/\s+/g, "-");
    return await buildFacilityMetadata(categorySlug, catSlug);
  }

  notFound();
}

export default async function CategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;

  // 1. Try as category
  if (isKnownCategory(categorySlug.toLowerCase())) {
    return (
      <DiscoveryTemplate
        params={Promise.resolve({ categorySlug })}
      />
    );
  }

  const dbValue = slugToDbValue(categorySlug);
  const hasCategory = await prisma.facility.findFirst({
    where: { category: { equals: dbValue ?? categorySlug, mode: "insensitive" } },
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
    const catSlug = dbValueToSlug(facility.category!) ?? facility.category!.toLowerCase().replace(/\s+/g, "-");
    return (
      <FacilityShowcaseTemplate
        params={Promise.resolve({
          categorySlug: catSlug,
          facilitySlug: categorySlug,
        })}
      />
    );
  }

  notFound();
}
