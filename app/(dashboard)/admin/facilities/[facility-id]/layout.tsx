import { ReactNode, Suspense } from "react"
import { prisma } from "@/server/lib/prisma"
import { notFound } from "next/navigation"
import { connection } from "next/server"

import { FacilityNav, FacilityNavSkeleton } from "./_components/nav"
import { FacilityActionSidebar, FacilityActionSidebarSkeleton } from "./_components/sidebar"
import type { Metadata } from "next"
import { FacilityLayoutContextHandler } from "./_components/facility-layout-context-handler"
import { FacilityProvider } from "./_components/facility-context"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ 'facility-id': string }>
}): Promise<Metadata> {
  const { 'facility-id': facilityId } = await params
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { name: true },
  })

  return {
    title: `${facility?.name || "Facility"} | Splashdeals Admin`,
    description: `Manage operations, tickets, and media for ${facility?.name || "this facility"}.`,
  }
}

export default async function FacilityManagementLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ 'facility-id': string }>
}) {
  await connection()
  const { 'facility-id': facilityId } = await params
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
        }
      }
    }
  })

  if (!facility) notFound()

  return (
    <FacilityProvider facility={{ id: facility.id, name: facility.name, status: facility.status, slug: facility.slug, category: facility.category }}>
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-background relative">
      <FacilityLayoutContextHandler 
        facilityId={facilityId} 
        facilityName={facility.name} 
      />
      
      {/* Immersive Ambient Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 blur-[100px] rounded-full -ml-48 -mb-48 pointer-events-none" />

      {/* 🧭 Unified Master Command Bar */}
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

      <div className="flex-1 p-4 md:p-8 relative z-10 w-full overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="xl:col-span-9 space-y-8">
            <Suspense fallback={<div className="h-96 animate-pulse bg-muted/50 rounded-xl" />}>
              {children}
            </Suspense>
          </div>

          <aside className="xl:col-span-3 sticky top-8 hidden xl:block">
            <Suspense fallback={<FacilityActionSidebarSkeleton />}>
              <FacilityActionSidebar facility={facility as { id: string; socialLinks?: Record<string, string | undefined>; publicPhone?: string | null; publicEmail?: string | null }} />
            </Suspense>
          </aside>
        </div>
      </div>
    </div>
    </FacilityProvider>
  )
}
