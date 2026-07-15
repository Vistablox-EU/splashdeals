import { connection } from "next/server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/app/(dashboard)/admin/_common/TableSkeleton";
import { AdminPageShell } from "@/app/(dashboard)/admin/_common/AdminPageShell";
import { FacilitiesList } from "./_components/facilities-list";
import { getFacilityCounts } from "@/app/(server)/lib/data/admin";

export const metadata: Metadata = {
  title: "Objekti | Splashdeals Admin",
  description: "Globalni direktorijum akva parkova i operativnih konfiguracija.",
};

export default async function FacilitiesDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    limit?: string;
    status?: string;
    sort?: string;
    order?: string;
  }>;
}) {
  await connection();
  const { q, page, limit, status, sort, order } = await searchParams;

  const counts = await getFacilityCounts();

  const stats = [
    {
      label: "Ukupno",
      value: counts.total,
      color: "text-foreground",
      glow: "border-border bg-muted/10",
      href: "/admin/facilities",
    },
    {
      label: "Aktivni",
      value: counts.active,
      color: "text-primary",
      glow: "border-primary/10 bg-primary/[0.02]",
      href: "/admin/facilities?status=ACTIVE",
    },
    {
      label: "Nacrti",
      value: counts.draft,
      color: "text-warning",
      glow: "border-warning/10 bg-warning/5",
      href: "/admin/facilities?status=DRAFT",
    },
    {
      label: "Zatvoreni",
      value: counts.closed,
      color: "text-muted-foreground",
      glow: "border-muted/10 bg-muted/5",
      href: "/admin/facilities?status=CLOSED",
    },
    {
      label: "Vanredno",
      value: counts.emergency,
      color: "text-destructive",
      glow: "border-destructive/10 bg-destructive/5",
      href: "/admin/facilities?status=EMERGENCY_SHUTDOWN",
    },
  ];

  return (
    <AdminPageShell
      title="Objekti"
      subtitle="Upravljajte objektima, dodajte nove lokacije i pratite globalni status."
      cta={{ label: "Novi objekat", href: "/admin/facilities/new", icon: "add" }}
      stats={stats}
      statsGridCols="md:grid-cols-2 lg:grid-cols-5"
    >
      <Suspense
        key={`${q}-${page}-${limit}-${status}-${sort}-${order}`}
        fallback={<TableSkeleton />}
      >
        <FacilitiesList q={q} page={page} limit={limit} status={status} sort={sort} order={order} />
      </Suspense>
    </AdminPageShell>
  );
}
