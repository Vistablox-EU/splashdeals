import { Icon } from "@/components/ui/Icon";
import { connection } from "next/server"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Suspense } from "react"
import { TableSkeleton } from "@/app/(dashboard)/admin/_common/TableSkeleton"
import { AdminMetricCard } from "@/app/(dashboard)/admin/_common/AdminMetricCard"
import { FacilitiesList } from "./_components/facilities-list"
import { getFacilityCounts } from "@/lib/data/admin"

export const metadata: Metadata = {
  title: "Objekti | Splashdeals Admin",
  description: "Globalni direktorijum akva parkova i operativnih konfiguracija.",
}

export default async function FacilitiesDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; limit?: string }>
}) {
  await connection()
  const { q, page, limit } = await searchParams

  const counts = await getFacilityCounts()

  const stats = [
    { label: "Ukupno", value: counts.total, color: "text-foreground", glow: "border-border bg-muted/10" },
    { label: "Aktivni", value: counts.active, color: "text-primary", glow: "border-primary/10 bg-primary/[0.02]" },
    { label: "Nacrti", value: counts.draft, color: "text-amber-400", glow: "border-amber-500/10 bg-amber-500/[0.02]" },
    { label: "Zatvoreni", value: counts.closed, color: "text-muted-foreground", glow: "border-muted/10 bg-muted/5" },
  ]

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 w-full relative overflow-hidden bg-background min-h-[calc(100vh-4rem)] rounded-2xl border border-border/50">
      {/* Immersive Ambient Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 blur-[100px] rounded-full -ml-48 -mb-48 pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase italic">Objekti</h1>
          <p className="text-muted-foreground mt-1.5 text-xs font-medium uppercase tracking-wider opacity-80">
            Manage all waterpark entities, onboard new locations, and overview global status.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest text-[11px] rounded-xl h-11 px-6 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300">
          <Link href="/admin/facilities/new">
            <Icon name="add" className="mr-2 text-[16px]" />
            Novi objekat
          </Link>
        </Button>
      </div>

      <div className="relative z-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <AdminMetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            glow={stat.glow}
          />
        ))}
      </div>
      
      <div className="relative z-10 mt-4">
        <Suspense key={`${q}-${page}-${limit}`} fallback={<TableSkeleton />}>
          <FacilitiesList q={q} page={page} limit={limit} />
        </Suspense>
      </div>
    </div>
  )
}
