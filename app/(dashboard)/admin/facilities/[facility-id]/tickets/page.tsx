import { Metadata } from "next"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { prisma } from "@/server/lib/prisma"
import { getTicketHierarchy } from "./_lib/ticket-admin-actions"
import { TicketManagementV2 } from "./_components/ticket-management-v2"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "facility-id": string }>
}): Promise<Metadata> {
  const { "facility-id": facilityId } = await params
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { name: true },
  })
  return {
    title: `${facility?.name || "Facility"} — Tickets | Splashdeals Admin`,
    description: `Manage ticket categories, products, and pricing for ${facility?.name || "this facility"}.`,
  }
}

export default async function TicketsPageV2({
  params,
}: {
  params: Promise<{ "facility-id": string }>
}) {
  const { "facility-id": facilityId } = await params
  await connection()

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { id: true, name: true, slug: true },
  })
  if (!facility) return notFound()

  const hierarchy = await getTicketHierarchy(facilityId).catch((e) => {
    console.error("getTicketHierarchy failed:", e instanceof Error ? e.message : e);
    throw e;
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/60 backdrop-blur-md shrink-0">
        <div>
          <h1 className="text-lg font-black tracking-tight text-foreground">
            Upravljanje Ulaznicama
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {facility.name} — Kategorije → Tipovi → Cene
          </p>
        </div>
      </div>

      {/* Three-panel layout */}
      <TicketManagementV2
        facilityId={facilityId}
        initialCategories={hierarchy}
      />
    </div>
  )
}
