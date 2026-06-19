import { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"
import { prisma } from "@/server/lib/prisma"
import { notFound } from "next/navigation"
import { TicketManagement } from "./_components/ticket-management"
import { SerializedAdminTicket, SerializedTicketGroup } from "./_components/columns"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon"

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
    title: `${facility?.name || "Facility"} — Ticket Management | Splashdeals Admin`,
    description: "Unified ticket and ticket group management hub for this facility.",
  }
}

export default async function TicketsPage({
  params,
}: {
  params: Promise<{ 'facility-id': string }>
}) {
  const { 'facility-id': facilityId } = await params
  await connection()

  const [ticketsRaw, facilityWithGroups] = await Promise.all([
    prisma.ticket.findMany({
      where: { facilityId },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        ticketGroups: {
          include: {
            tickets: { orderBy: { displayOrder: "asc" } },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
  ])

  if (!facilityWithGroups) return notFound()

  // Serialize Decimal → number for tickets (NO spread — explicit fields only to
  // avoid leaking Prisma Decimal objects past the server/client boundary)
  const tickets: SerializedAdminTicket[] = ticketsRaw.map((t) => ({
    id: t.id,
    facilityId: t.facilityId,
    groupId: t.groupId,
    title: t.title,
    type: t.type,
    currency: t.currency,
    validityType: t.validityType,
    isActive: t.isActive,
    isFeatured: t.isFeatured,
    displayOrder: t.displayOrder,
    saleStart: t.saleStart,
    saleEnd: t.saleEnd,
    description: t.description,
    descriptionSr: t.descriptionSr,
    titleSr: t.titleSr,
    imageUrl: t.imageUrl,
    finePrint: t.finePrint,
    requiresIdentity: t.requiresIdentity,
    requiresPhoto: t.requiresPhoto,
    dayType: t.dayType,
    timeSlot: t.timeSlot,
    isSeasonPass: t.isSeasonPass,
    minPeople: t.minPeople,
    maxPeople: t.maxPeople,
    slug: t.slug,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    price: Number(t.price),
    originalPrice: t.originalPrice ? Number(t.originalPrice) : null,
  }))

  // Serialize groups + their nested tiers (same dual-key alias pattern)
  const groups: SerializedTicketGroup[] = facilityWithGroups.ticketGroups.map((group) => {
    const tiers: SerializedAdminTicket[] = group.tickets.map((ticket) => ({
      id: ticket.id,
      facilityId: ticket.facilityId,
      groupId: ticket.groupId,
      title: ticket.title,
      type: ticket.type,
      currency: ticket.currency,
      validityType: ticket.validityType,
      isActive: ticket.isActive,
      isFeatured: ticket.isFeatured,
      displayOrder: ticket.displayOrder,
      saleStart: ticket.saleStart,
      saleEnd: ticket.saleEnd,
      description: ticket.description,
      descriptionSr: ticket.descriptionSr,
      titleSr: ticket.titleSr,
      imageUrl: ticket.imageUrl,
      finePrint: ticket.finePrint,
      requiresIdentity: ticket.requiresIdentity,
      requiresPhoto: ticket.requiresPhoto,
      dayType: ticket.dayType,
      timeSlot: ticket.timeSlot,
      isSeasonPass: ticket.isSeasonPass,
      minPeople: ticket.minPeople,
      maxPeople: ticket.maxPeople,
      slug: ticket.slug,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      label: ticket.titleSr ?? ticket.title,
      price: Number(ticket.price),
      originalPrice: ticket.originalPrice ? Number(ticket.originalPrice) : null,
    }))
    return {
      id: group.id,
      facilityId: group.facilityId,
      title: group.title,
      titleSr: group.titleSr,
      description: group.description,
      descriptionSr: group.descriptionSr,
      displayOrder: group.displayOrder,
      isActive: group.isActive,
      slug: group.slug,
      tickets: tiers,
      tiers,
    }
  })

  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-muted/50">
        <Link href={`/admin/facilities/${facilityId}`}>
          <Icon name="keyboard_arrow_left" className="size-4" />
        </Link>
      </Button>
      <TicketManagement
        facilityId={facilityId}
        initialTickets={tickets}
        initialGroups={groups}
        facilityStatus={facilityWithGroups.status}
      />
    </div>
  )
}
