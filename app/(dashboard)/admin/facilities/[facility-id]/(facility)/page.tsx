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
    title: `${facility?.name || 'Facility'} Overview | Splashdeals Admin`,
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
      label: "Active Tickets", 
      value: facility._count.tickets, 
      icon: "confirmation_number", 
      color: "text-blue-400",
      href: `/admin/facilities/${facilityId}/tickets`
    },
    { 
      label: "Amenities", 
      value: facility._count.amenities, 
      icon: "auto_awesome", 
      color: "text-emerald-400",
      href: `/admin/facilities/${facilityId}/amenities`
    },
    { 
      label: "Media Assets", 
      value: facility._count.media, 
      icon: "photo_library", 
      color: "text-amber-400",
      href: `/admin/facilities/${facilityId}/media`
    }
  ]

  return (
    <div className="flex flex-col gap-8 bg-slate-950 min-h-screen w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-500 uppercase tracking-widest">
              {facility.status}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              ID: {facility.id.split('-')[0]}
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">{facility.name}</h1>
          <p className="text-sm text-slate-400 font-medium">
            {facility.streetName} {facility.streetNumber}, {facility.city}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href={`/admin/facilities/${facilityId}/profile`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <Icon name="settings" className="text-[14px]" />
            Edit Profile
          </Link>
          <Link 
            href={`/facilities/${facility.category.toLowerCase()}/${facility.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-xs font-black text-slate-950 hover:opacity-90 transition-all"
          >
            Live View
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link 
            key={stat.label}
            href={stat.href}
            className="group flex flex-col gap-4 p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl hover:border-white/10 hover:bg-slate-900/60 transition-all"
          >
            <div className="flex items-center justify-between">
              <Icon name={stat.icon} className={`text-[20px] ${stat.color}`} />
              <Icon name="arrow_forward" className="text-[16px] text-slate-700 group-hover:text-slate-400 transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">{stat.value}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">{stat.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            <Icon name="monitor_heart" className="text-[14px] text-primary" />
            Recent Ticket Updates
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-900/20 overflow-hidden">
            {recentTickets.length > 0 ? (
              <div className="divide-y divide-white/5">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-200">{ticket.title}</span>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                        {ticket.type} • {Number(ticket.price)} RSD
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-600">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <Icon name="confirmation_number" className="text-[32px] text-slate-800" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No tickets found</p>
                  <Link 
                    href={`/admin/facilities/${facilityId}/tickets`}
                    className="text-[10px] font-black text-primary uppercase hover:underline"
                  >
                    Create your first ticket
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Internal Details
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 space-y-6">
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Onboarded On</span>
              <p className="text-sm font-bold text-slate-200">
                {new Date(facility.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Location Hash</span>
              <p className="text-xs font-mono text-slate-400 break-all">
                {facility.lat?.toFixed(4)}, {facility.lng?.toFixed(4)}
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
              <Link 
                href={`/admin/facilities/${facilityId}/media`}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors flex items-center justify-between"
              >
                Manage Media Assets
                <Icon name="arrow_forward" className="text-[12px]" />
              </Link>
              <Link 
                href={`/admin/facilities/${facilityId}/profile`}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors flex items-center justify-between"
              >
                Governance Controls
                <Icon name="arrow_forward" className="text-[12px]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
