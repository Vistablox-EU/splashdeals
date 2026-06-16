import { connection } from "next/server"
import { DashboardClient } from "./_components/DashboardClient"
import type { Metadata } from "next"
import { getAdminDashboardStats, getRecentActivity } from "@/lib/data/admin"

export const metadata: Metadata = {
  title: "Command Center | Governance Hub",
  description: "Real-time institutional oversight and facility management console.",
}

export default async function Page() {
  await connection();

  const [stats, recentActivity] = await Promise.all([
    getAdminDashboardStats(),
    getRecentActivity(),
  ]);

  const dashboardData = {
    ...stats,
    recentActivity: recentActivity.map(tx => ({
      id: tx.id,
      totalAmount: Number(tx.totalAmount),
      status: tx.status,
      createdAt: tx.createdAt,
      city: tx.facility.city
    }))
  };

  return <DashboardClient stats={dashboardData} />
}
