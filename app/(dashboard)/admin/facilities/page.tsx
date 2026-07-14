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
  searchParams: Promise<{ q?: string; page?: string; limit?: string }>;
}) {
  await connection();
  const { q, page, limit } = await searchParams;

  const counts = await getFacilityCounts();

  const stats = [
    {
      label: "Ukupno",
      value: counts.total,
      color: "text-foreground",
      glow: "border-border bg-muted/10",
    },
    {
      label: "Aktivni",
      value: counts.active,
      color: "text-primary",
      glow: "border-primary/10 bg-primary/[0.02]",
    },
    {
      label: "Nacrti",
      value: counts.draft,
      color: "text-warning",
      glow: "border-warning/10 bg-warning/5",
    },
    {
      label: "Zatvoreni",
      value: counts.closed,
      color: "text-muted-foreground",
      glow: "border-muted/10 bg-muted/5",
    },
  ];

  return (
    <AdminPageShell
      title="Objekti"
      subtitle="Manage all waterpark entities, onboard new locations, and overview global status."
      cta={{ label: "Novi objekat", href: "/admin/facilities/new", icon: "add" }}
      stats={stats}
    >
      <Suspense key={`${q}-${page}-${limit}`} fallback={<TableSkeleton />}>
        <FacilitiesList q={q} page={page} limit={limit} />
      </Suspense>
    </AdminPageShell>
  );
}
