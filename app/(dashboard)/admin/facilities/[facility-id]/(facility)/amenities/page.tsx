import { notFound } from "next/navigation"
import { connection } from "next/server"
import { prisma } from "@/server/lib/prisma"
import { CompactAmenitiesTable } from "../_components/amenities"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import type { Metadata } from "next"

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
    title: `${facility?.name || "Facility"} — Amenities | Splashdeals Admin`,
    description: `Manage features and active amenities for ${facility?.name || "this facility"}.`,
  }
}

interface AmenitiesPageProps {
  params: Promise<{
    'facility-id': string
  }>
}

export default async function AmenitiesPage({ params }: AmenitiesPageProps) {
  const { 'facility-id': facilityId } = await params
  await connection()
  
  const [facility, allAmenities] = await Promise.all([
    prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        amenities: {
          orderBy: { displayOrder: "asc" }
        }
      }
    }),
    prisma.amenity.findMany({
      orderBy: { name: "asc" }
    })
  ])
  
  if (!facility) notFound()
  
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-white/10">
              <Link href={`/admin/facilities/${facilityId}`}>
                <Icon name="keyboard_arrow_left" className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-black text-white italic tracking-tight">Infrastructure & Features</h1>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-11">
            Manage active features and amenities for {facility.name}
          </p>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
           <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Live Editor</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-1">
        <CompactAmenitiesTable 
          facilityId={facility.id}
          allAmenities={allAmenities}
          initialFacilityAmenities={facility.amenities}
        />
      </div>
    </div>
  )
}
