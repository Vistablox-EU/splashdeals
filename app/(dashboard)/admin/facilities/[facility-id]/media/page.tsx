import type { Metadata } from "next"
import Link from "next/link"
import { MediaGallery } from "./_components/media-gallery"
import { prisma } from "@/server/lib/prisma"
import { connection } from "next/server"
import { MediaPurpose } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"

const PAGE_SIZE = 50

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

export default async function MediaPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ 'facility-id': string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { 'facility-id': facilityId } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1)
  const skip = (page - 1) * PAGE_SIZE
  await connection()

  const [mediaItems, totalCount] = await Promise.all([
    prisma.facilityMedia.findMany({
      where: { facilityId, purpose: { not: MediaPurpose.TICKET } },
      orderBy: { order: "asc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.facilityMedia.count({
      where: { facilityId, purpose: { not: MediaPurpose.TICKET } },
    }),
  ])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-muted/50">
        <Link href={`/admin/facilities/${facilityId}`}>
          <Icon name="keyboard_arrow_left" className="size-4" />
        </Link>
      </Button>
      <MediaGallery 
        facilityId={facilityId} 
        initialMedia={mediaItems}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  )
}
