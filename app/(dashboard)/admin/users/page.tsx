import { connection } from "next/server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { TableSkeleton } from "@/app/(dashboard)/admin/_common/TableSkeleton";
import { AdminPageShell } from "@/app/(dashboard)/admin/_common/AdminPageShell";
import { UsersList } from "./_components/users-list";
import { requireSuperAdmin } from "@/app/(server)/lib/auth-guards";
import { getUserCounts } from "@/lib/data/admin";

export const metadata: Metadata = {
  title: "Korisnici | Splashdeals Admin",
  description: "Manage administrative access and roles for Splashdeals.",
};

export default async function UsersManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  await connection();
  const { page, limit } = await searchParams;
  await requireSuperAdmin({ redirect: true });

  const counts = await getUserCounts();

  const stats = [
    {
      label: "Ukupno administratora",
      value: counts.total,
      color: "text-foreground",
      glow: "border-border bg-muted/10",
    },
    {
      label: "Super administratori",
      value: counts.superAdmins,
      color: "text-primary",
      glow: "border-primary/10 bg-primary/[0.02]",
    },
    {
      label: "Osoblje",
      value: counts.staff,
      color: "text-amber-400",
      glow: "border-amber-500/10 bg-amber-500/[0.02]",
    },
  ];

  return (
    <AdminPageShell
      title="Korisnici"
      subtitle="Control administrative access, assign roles, and audit security accounts."
      cta={{ label: "Novi administrator", href: "/admin/users/new", icon: "person_add" }}
      stats={stats}
      statsGridCols="md:grid-cols-3 lg:grid-cols-3"
    >
      <Suspense key={`${page}-${limit}`} fallback={<TableSkeleton />}>
        <UsersList page={page} limit={limit} />
      </Suspense>
    </AdminPageShell>
  );
}
