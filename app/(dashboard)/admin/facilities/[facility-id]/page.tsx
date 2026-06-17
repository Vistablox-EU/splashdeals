import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/server/lib/prisma"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Metadata } from "next"

interface OverviewPageProps {
  params: Promise<{
    'facility-id': string
  }>
}

export async function generateMetadata({ params }: OverviewPageProps): Promise<Metadata> {
  const { 'facility-id': facilityId } = await params
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { name: true }
  })
  
  return {
    title: `${facility?.name || 'Objekat'} Pregled | Splashdeals Admin`,
  }
}

export default async function FacilityOverviewPage({ params }: OverviewPageProps) {
  await connection()
  const { 'facility-id': facilityId } = await params
  
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    include: {
      _count: {
        select: {
          tickets: true,
          amenities: true,
          media: true,
        }
      }
    }
  })

  if (!facility) notFound()

  const recentTickets = await prisma.ticket.findMany({
    where: { facilityId },
    take: 5,
    orderBy: { updatedAt: 'desc' }
  })

  const stats = [
    { 
      label: "Ulaznice", 
      value: facility._count.tickets, 
      icon: "confirmation_number", 
      color: "text-blue-400",
      href: `/admin/facilities/${facilityId}/tickets`
    },
    { 
      label: "Sadržaji", 
      value: facility._count.amenities, 
      icon: "auto_awesome", 
      color: "text-emerald-400",
      href: `/admin/facilities/${facilityId}/amenities`
    },
    { 
      label: "Mediji", 
      value: facility._count.media, 
      icon: "photo_library", 
      color: "text-amber-400",
      href: `/admin/facilities/${facilityId}/media`
    }
  ]

  return (
    <div className="flex flex-col gap-8 bg-background min-h-screen w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-500 uppercase tracking-widest">
              {facility.status}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              ID: {facility.id.split('-')[0]}
            </span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">{facility.name}</h1>
          <p className="text-sm text-muted-foreground font-medium">
            {facility.streetName} {facility.streetNumber}, {facility.city}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border text-xs font-bold text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-all">
            <Link href={`/admin/facilities/${facilityId}/profile`}>
              <Icon name="settings" className="text-[14px]" />
              Izmeni profil
            </Link>
          </Button>
          <Button asChild className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-xs font-black text-primary-foreground hover:opacity-90 transition-all">
            <Link href={`/facilities/${facility.category.toLowerCase()}/${facility.slug}`} target="_blank">
              Prikaz na sajtu
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link 
            key={stat.label}
            href={stat.href}
            className="group flex flex-col gap-4 p-6 rounded-2xl border border-border/50 bg-muted/40 backdrop-blur-xl hover:border-border hover:bg-muted/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <Icon name={stat.icon} className={`text-[20px] ${stat.color}`} />
              <Icon name="arrow_forward" className="text-[16px] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-foreground">{stat.value}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">{stat.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <Icon name="monitor_heart" className="text-[14px] text-primary" />
            Poslednje izmene
          </div>
          <div className="rounded-2xl border border-border/50 bg-muted/20 overflow-hidden">
            {recentTickets.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-foreground/90">{ticket.title}</span>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                        {ticket.type} • {Number(ticket.price)} RSD
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground/80">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <Icon name="confirmation_number" className="text-[32px] text-muted-foreground/40" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nema ulaznica</p>
                  <Link 
                    href={`/admin/facilities/${facilityId}/tickets`}
                    className="text-[10px] font-black text-primary uppercase hover:underline"
                  >
                    Kreirajte prvu ulaznicu
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Detalji
          </div>
          <div className="rounded-2xl border border-border/50 bg-muted/40 p-6 space-y-6">
            <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Datum registracije</span>
              <p className="text-sm font-bold text-foreground/90">
                {new Date(facility.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Location Hash</span>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {facility.lat?.toFixed(4)}, {facility.lng?.toFixed(4)}
              </p>
            </div>
            <div className="pt-4 border-t border-border/50 flex flex-col gap-3">
              <Link 
                href={`/admin/facilities/${facilityId}/media`}
                className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors flex items-center justify-between"
              >
                Upravljanje medijima
                <Icon name="arrow_forward" className="text-[12px]" />
              </Link>
              <Link 
                href={`/admin/facilities/${facilityId}/profile`}
                className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors flex items-center justify-between"
              >
                Podešavanja
                <Icon name="arrow_forward" className="text-[12px]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
