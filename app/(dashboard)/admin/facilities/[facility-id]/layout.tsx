import { ReactNode, Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { FacilityNav, FacilityNavSkeleton } from "./_components/nav";
import { FacilityActionSidebar, FacilityActionSidebarSkeleton } from "./_components/sidebar";
import { SlotError } from "./_components/slot-error";
import { FacilityLayoutContextHandler } from "./_components/facility-layout-context-handler";
import { FacilityProvider } from "./_components/facility-context";
import { getFacilityAdminShell } from "./_lib/get-facility-admin";
import { FacilityBreadcrumb } from "./_components/facility-breadcrumb";

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
  const facility = await getFacilityAdminShell(facilityId);

  return {
    title: `${facility?.name || "Objekat"} | Splashdeals Admin`,
    description: `Upravljajte operacijama, ulaznicama i medijima za ${facility?.name || "ovaj objekat"}.`,
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
  const facility = await getFacilityAdminShell(facilityId);

  if (!facility) notFound();

  return (
    <FacilityProvider
      facility={{
        id: facility.id,
        name: facility.name,
        status: facility.status,
        slug: facility.slug,
        category: facility.category,
        streetName: facility.streetName,
        streetNumber: facility.streetNumber,
        city: facility.city,
        lat: facility.lat,
        lng: facility.lng,
        counts: {
          ticketCategories: facility._count.ticketCategories,
          media: facility._count.media,
          amenities: facility._count.amenities,
          faq: facility._count.faqs,
        },
      }}
    >
      <div className="bg-background relative flex h-full flex-1 flex-col overflow-hidden">
        <FacilityLayoutContextHandler facilityId={facilityId} facilityName={facility.name} />

        <div className="bg-primary/5 pointer-events-none absolute top-0 right-0 -mt-64 -mr-64 h-[500px] w-[500px] rounded-full blur-[120px]" />
        <div className="bg-accent/5 pointer-events-none absolute bottom-0 left-0 -mb-48 -ml-48 h-[400px] w-[400px] rounded-full blur-[100px]" />

        <FacilityBreadcrumb facilityName={facility.name} facilityId={facilityId} />

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
          <div className="animate-in fade-in slide-in-from-bottom-2 grid grid-cols-1 items-start gap-8 duration-700 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-9">
              <Suspense fallback={<div className="bg-muted/50 h-96 animate-pulse rounded-xl" />}>
                {children}
              </Suspense>
            </div>

            <aside className="sticky top-8 hidden lg:col-span-3 lg:block">
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
