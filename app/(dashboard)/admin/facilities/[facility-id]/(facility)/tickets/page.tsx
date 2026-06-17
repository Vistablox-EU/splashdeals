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

  // Serialize Decimal → number for tickets
  const tickets: SerializedAdminTicket[] = ticketsRaw.map((t) => ({
    ...t,
    price: Number(t.price),
    originalPrice: t.originalPrice ? Number(t.originalPrice) : null,
  }))

  // Serialize groups + their nested tiers (same dual-key alias pattern)
  const groups: SerializedTicketGroup[] = facilityWithGroups.ticketGroups.map((group) => {
    const tiers: SerializedAdminTicket[] = group.tickets.map((ticket) => ({
      ...ticket,
      label: ticket.titleSr ?? ticket.title,
      price: Number(ticket.price),
      originalPrice: ticket.originalPrice ? Number(ticket.originalPrice) : null,
    }))
    return {
      ...group,
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
