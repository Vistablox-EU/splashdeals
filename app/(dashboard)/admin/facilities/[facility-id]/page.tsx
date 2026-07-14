import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { prisma } from "@/app/(server)/lib/prisma";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface OverviewPageProps {
  params: Promise<{
    "facility-id": string;
  }>;
}

export async function generateMetadata({ params }: OverviewPageProps): Promise<Metadata> {
  const { "facility-id": facilityId } = await params;
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { name: true },
  });

  return {
    title: `${facility?.name || "Objekat"} Pregled | Splashdeals Admin`,
  };
}

export default async function FacilityOverviewPage({ params }: OverviewPageProps) {
  await connection();
  const { "facility-id": facilityId } = await params;

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    include: {
      _count: {
        select: {
          amenities: true,
          media: true,
        },
      },
    },
  });

  if (!facility) notFound();

  const ticketCount = await prisma.ticketPrice.count({
    where: { ticketType: { category: { facilityId } } },
  });

  const recentTickets = await prisma.ticketPrice.findMany({
    where: { isActive: true, ticketType: { category: { facilityId } } },
    take: 5,
    orderBy: { updatedAt: "desc" },
    include: { ticketType: true },
  });

  const stats = [
    {
      label: "Total Tickets",
      value: ticketCount,
      icon: "confirmation_number",
      color: "text-primary",
      href: `/admin/facilities/${facilityId}/tickets`,
    },
    {
      label: "Sadržaji",
      value: facility._count.amenities,
      icon: "auto_awesome",
      color: "text-primary",
      href: `/admin/facilities/${facilityId}/amenities`,
    },
    {
      label: "Mediji",
      value: facility._count.media,
      icon: "photo_library",
      color: "text-warning",
      href: `/admin/facilities/${facilityId}/media`,
    },
  ];

  return (
    <div className="bg-background flex min-h-screen w-full flex-col gap-8">
      {/* Header */}
      <div className="border-border/50 flex flex-col justify-between gap-4 border-b pb-8 md:flex-row md:items-center">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 border-primary/20 text-primary rounded border px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">
              {facility.status}
            </span>
            <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
              ID: {facility.id.split("-")[0]}
            </span>
          </div>
          <h1 className="text-foreground text-3xl font-black tracking-tight">{facility.name}</h1>
          <p className="text-muted-foreground text-sm font-medium">
            {facility.streetName} {facility.streetNumber}, {facility.city}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="bg-muted/30 border-border text-foreground/80 hover:bg-muted/50 hover:text-foreground flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold transition-all"
          >
            <Link href={`/admin/facilities/${facilityId}/profile`}>
              <Icon name="settings" className="text-[14px]" />
              Izmeni profil
            </Link>
          </Button>
          <Button
            asChild
            className="bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition-all hover:opacity-90"
          >
            <Link
              href={`/facilities/${facility.category.toLowerCase()}/${facility.slug}`}
              target="_blank"
            >
              Prikaz na sajtu
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group border-border/50 bg-muted/40 hover:border-border hover:bg-muted/60 flex flex-col gap-4 rounded-2xl border p-6 backdrop-blur-xl transition-all"
          >
            <div className="flex items-center justify-between">
              <Icon name={stat.icon} className={`text-[20px] ${stat.color}`} />
              <Icon
                name="arrow_forward"
                className="text-muted-foreground/60 group-hover:text-muted-foreground text-[16px] transition-colors"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground text-3xl font-black">{stat.value}</span>
              <span className="text-muted-foreground mt-1 text-[10px] font-bold tracking-[0.2em] uppercase">
                {stat.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="text-muted-foreground flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase">
            <Icon name="monitor_heart" className="text-primary text-[14px]" />
            Poslednje izmene
          </div>
          <div className="border-border/50 bg-muted/20 overflow-hidden rounded-2xl border">
            {recentTickets.length > 0 ? (
              <div className="divide-border/50 divide-y">
                {recentTickets.map(
                  (ticket: {
                    id: string;
                    ticketType?: { title?: string } | null;
                    price: { toString: () => string };
                    updatedAt: string | Date;
                  }) => (
                    <div
                      key={ticket.id}
                      className="hover:bg-muted/10 flex items-center justify-between p-4 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-foreground/90 text-sm font-bold">
                          {ticket.ticketType?.title || "Ulaznica"}
                        </span>
                        <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
                          {Number(ticket.price)} RSD
                        </span>
                      </div>
                      <div className="text-muted-foreground/80 font-mono text-[10px]">
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Icon name="confirmation_number" className="text-muted-foreground/40 text-[32px]" />
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
                    Nema ulaznica
                  </p>
                  <Link
                    href={`/admin/facilities/${facilityId}/tickets`}
                    className="text-primary text-[10px] font-black uppercase hover:underline"
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
          <div className="text-muted-foreground flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase">
            Detalji
          </div>
          <div className="border-border/50 bg-muted/40 space-y-6 rounded-2xl border p-6">
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-[9px] font-bold tracking-widest uppercase">
                Datum registracije
              </span>
              <p className="text-foreground/90 text-sm font-bold">
                {new Date(facility.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-[9px] font-bold tracking-widest uppercase">
                Location Hash
              </span>
              <p className="text-muted-foreground font-mono text-xs break-all">
                {facility.lat?.toFixed(4)}, {facility.lng?.toFixed(4)}
              </p>
            </div>
            <div className="border-border/50 flex flex-col gap-3 border-t pt-4">
              <Link
                href={`/admin/facilities/${facilityId}/media`}
                className="text-muted-foreground hover:text-foreground flex items-center justify-between text-[10px] font-black tracking-widest uppercase transition-colors"
              >
                Upravljanje medijima
                <Icon name="arrow_forward" className="text-[12px]" />
              </Link>
              <Link
                href={`/admin/facilities/${facilityId}/profile`}
                className="text-muted-foreground hover:text-foreground flex items-center justify-between text-[10px] font-black tracking-widest uppercase transition-colors"
              >
                Podešavanja
                <Icon name="arrow_forward" className="text-[12px]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
