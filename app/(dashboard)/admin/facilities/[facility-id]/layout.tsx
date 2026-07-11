import { ReactNode, Suspense } from "react";
import { prisma } from "@/server/lib/prisma";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { FacilityNav, FacilityNavSkeleton } from "./_components/nav";
import { FacilityActionSidebar, FacilityActionSidebarSkeleton } from "./_components/sidebar";
import { SlotError } from "./_components/slot-error";
import type { Metadata } from "next";
import { FacilityLayoutContextHandler } from "./_components/facility-layout-context-handler";
import { FacilityProvider } from "./_components/facility-context";

interface FacilityLayoutData {
  id: string;
  socialLinks?: Record<string, string | undefined>;
  publicPhone?: string | null;
  publicEmail?: string | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "facility-id": string }>;
}): Promise<Metadata> {
  const { "facility-id": facilityId } = await params;
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { name: true },
  });

  return {
    title: `${facility?.name || "Facility"} | Splashdeals Admin`,
    description: `Manage operations, tickets, and media for ${facility?.name || "this facility"}.`,
  };
}

export default async function FacilityManagementLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ "facility-id": string }>;
}) {
  await connection();
  const { "facility-id": facilityId } = await params;
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: {
      id: true,
      name: true,
      status: true,
      slug: true,
      category: true,
      updatedAt: true,
      socialLinks: true,
      publicPhone: true,
      publicEmail: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
      hours: true,
      _count: {
        select: {
          ticketCategories: true,
          media: true,
          amenities: true,
          faqs: true,
        },
      },
    },
  });

  if (!facility) notFound();

  return (
    <FacilityProvider
      facility={{
        id: facility.id,
        name: facility.name,
        status: facility.status,
        slug: facility.slug,
        category: facility.category,
      }}
    >
      <div className="bg-background relative flex h-full flex-1 flex-col overflow-hidden">
        <FacilityLayoutContextHandler facilityId={facilityId} facilityName={facility.name} />

        {/* Immersive Ambient Glow */}
        <div className="bg-primary/5 pointer-events-none absolute top-0 right-0 -mt-64 -mr-64 h-[500px] w-[500px] rounded-full blur-[120px]" />
        <div className="bg-accent/5 pointer-events-none absolute bottom-0 left-0 -mb-48 -ml-48 h-[400px] w-[400px] rounded-full blur-[100px]" />

        {/* 🧭 Unified Master Command Bar */}
        <ErrorBoundary fallback={<SlotError reset={() => {}} title="Navigacija nije učitana" />}>
          <Suspense fallback={<FacilityNavSkeleton />}>
            <FacilityNav
              facility={facility}
              counts={{
                ticketCategories: facility._count.ticketCategories,
                media: facility._count.media,
                amenities: facility._count.amenities,
                faq: facility._count.faqs,
              }}
            />
          </Suspense>
        </ErrorBoundary>

        <div className="relative z-10 w-full flex-1 overflow-y-auto p-4 md:p-8">
          <div className="animate-in fade-in slide-in-from-bottom-2 grid grid-cols-1 items-start gap-8 duration-700 xl:grid-cols-12">
            <div className="space-y-8 xl:col-span-9">
              <Suspense fallback={<div className="bg-muted/50 h-96 animate-pulse rounded-xl" />}>
                {children}
              </Suspense>
            </div>

            <aside className="sticky top-8 hidden xl:col-span-3 xl:block">
              <ErrorBoundary fallback={<SlotError reset={() => {}} title="Sidebar nije učitan" />}>
                <Suspense fallback={<FacilityActionSidebarSkeleton />}>
                  <FacilityActionSidebar facility={facility as FacilityLayoutData} />
                </Suspense>
              </ErrorBoundary>
            </aside>
          </div>
        </div>
      </div>
    </FacilityProvider>
  );
}
