import type { Metadata } from "next"
import { MediaGallery } from "./_components/media-gallery"
import { prisma } from "@/server/lib/prisma"
import { connection } from "next/server"
import { MediaPurpose } from "@prisma/client"

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
    title: `${facility?.name || "Facility"} — Media | Splashdeals Admin`,
    description: `Manage gallery, photos, and branding for ${facility?.name || "this facility"}.`,
  }
}

export default async function MediaPage({ params }: { params: Promise<{ 'facility-id': string }> }) {
  const { 'facility-id': facilityId } = await params
  await connection()
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { media: true }
  })
  
  // 🛡️ Filter out any ticket-specific images from the general facility media gallery
  const filteredMedia = (facility?.media || []).filter(
    (item) => item.purpose !== MediaPurpose.TICKET
  )
  
  return <MediaGallery facilityId={facilityId} initialMedia={filteredMedia} />
}
