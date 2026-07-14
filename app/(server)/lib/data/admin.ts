import { prisma } from "@/app/(server)/lib/prisma";

export async function getAdminDashboardStats() {
  const [revenueRaw, facilityCount, userCount, ticketCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { status: "SUCCESS" },
      _sum: { totalAmount: true },
    }),
    prisma.facility.count(),
    prisma.user.count(),
    prisma.ticketPrice.count({ where: { isActive: true } }),
  ]);

  return {
    totalRevenue: Number(revenueRaw._sum.totalAmount || 0),
    activeFacilities: facilityCount,
    totalCustomers: userCount,
    activeTickets: ticketCount,
  };
}

export interface RecentActivityItem {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  city: string;
}

export async function getRecentActivity(): Promise<RecentActivityItem[]> {
  const transactions = await prisma.transaction.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      facility: { select: { city: true } },
    },
  });

  return transactions.map((tx) => ({
    id: tx.id,
    totalAmount: Number(tx.totalAmount),
    status: tx.status,
    createdAt: tx.createdAt,
    city: tx.facility?.city ?? "Unknown",
  }));
}

export async function getFacilityCounts() {
  const [total, active, draft, closed, emergency] = await Promise.all([
    prisma.facility.count(),
    prisma.facility.count({ where: { status: "ACTIVE" } }),
    prisma.facility.count({ where: { status: "DRAFT" } }),
    prisma.facility.count({ where: { status: "CLOSED" } }),
    prisma.facility.count({ where: { status: "EMERGENCY_SHUTDOWN" } }),
  ]);

  return { total, active, draft, closed, emergency };
}

export async function getUserCounts() {
  const [total, superAdmins, staff] = await Promise.all([
    prisma.user.count({ where: { role: { in: ["SUPER_ADMIN", "FACILITY_STAFF"] } } }),
    prisma.user.count({ where: { role: "SUPER_ADMIN" } }),
    prisma.user.count({ where: { role: "FACILITY_STAFF" } }),
  ]);

  return { total, superAdmins, staff };
}

export async function getCustomerCounts() {
  const [total, withActiveTickets, withTransactions] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({
      where: {
        role: "CUSTOMER",
        issuedTickets: { some: { status: "ACTIVE" } },
      },
    }),
    prisma.user.count({
      where: {
        role: "CUSTOMER",
        transactions: { some: {} },
      },
    }),
  ]);

  return { total, withActiveTickets, withTransactions };
}

export async function getFacilityName(id: string) {
  const facility = await prisma.facility.findUnique({
    where: { id },
    select: { name: true },
  });
  return facility?.name ?? null;
}
