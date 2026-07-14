import { connection } from "next/server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/app/(dashboard)/admin/_common/TableSkeleton";
import { AdminPageShell } from "@/app/(dashboard)/admin/_common/AdminPageShell";
import { requireSuperAdmin } from "@/app/(server)/lib/auth-guards";
import { getCustomerCounts } from "@/app/(server)/lib/data/admin";
import { CustomersTable } from "./_components/customers-table";

export const metadata: Metadata = {
  title: "Korisnici | Splashdeals Admin",
  description: "Manage buyer user accounts for Splashdeals.",
};

export default async function CustomersManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; search?: string }>;
}) {
  await connection();
  const { page, limit, search } = await searchParams;
  await requireSuperAdmin({ redirect: true });

  const counts = await getCustomerCounts();

  const stats = [
    {
      label: "Ukupno kupaca",
      value: counts.total,
      color: "text-foreground",
      glow: "border-border bg-muted/10",
    },
    {
      label: "Sa aktivnim kartama",
      value: counts.withActiveTickets,
      color: "text-primary",
      glow: "border-primary/10 bg-primary/[0.02]",
    },
    {
      label: "Sa transakcijama",
      value: counts.withTransactions,
      color: "text-amber-400",
      glow: "border-amber-500/10 bg-amber-500/[0.02]",
    },
  ];

  return (
    <AdminPageShell
      title="Korisnici"
      subtitle="Manage buyer accounts, view transaction history and active tickets."
      stats={stats}
      statsGridCols="md:grid-cols-3 lg:grid-cols-3"
    >
      <Suspense key={`${page}-${limit}-${search}`} fallback={<TableSkeleton />}>
        <CustomersTable page={page} limit={limit} search={search} />
      </Suspense>
    </AdminPageShell>
  );
}
