import { Icon } from "@/components/ui/Icon";
 
import type { Metadata } from "next"
import { prisma } from "@/server/lib/prisma"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { OperationsTable } from "./_components/operations-control-manager"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
    title: `${facility?.name || "Facility"} — Operations | Splashdeals Admin`,
    description: `Manage operating hours and seasonal schedules for ${facility?.name || "this facility"}.`,
  }
}

interface OperationsPageProps {
  params: Promise<{
    'facility-id': string
  }>
}

export default async function FacilityOperationsPage({ params }: OperationsPageProps) {
  const { 'facility-id': facilityId } = await params
  await connection()

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: {
      id: true,
      name: true,
      hours: { orderBy: { dayOfWeek: "asc" } },
    }
  })

  if (!facility) return notFound()

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between bg-muted/40 p-6 rounded-2xl border border-border/50 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-muted/50">
              <Link href={`/admin/facilities/${facilityId}`}>
                <Icon name="keyboard_arrow_left" className="size-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-black text-foreground italic tracking-tight">Operational Pulse</h1>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-11">
            Adjust entry availability for {facility.name}
          </p>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
           <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live Editor</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-muted/20 p-1">
        <OperationsTable 
          facilityId={facilityId} 
          initialHours={facility.hours} 
        />
      </div>
    </div>
  )
}
