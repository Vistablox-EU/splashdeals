import "server-only";

import { prisma } from "@/server/lib/prisma";
import { requireFacilityOwner } from "@/server/lib/auth-guards";
import { getFacilityViews } from "@/app/(server)/lib/analytics";

export async function getOwnerFacilitiesAction() {
  const user = await requireFacilityOwner();
  if (user.role === "SUPER_ADMIN") {
    return prisma.facility.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, slug: true, city: true },
    });
  }
  return prisma.facility.findMany({
    where: { owners: { some: { userId: user.id } }, status: "ACTIVE" },
    select: { id: true, name: true, slug: true, city: true },
  });
}

export async function getOwnerTicketPricesAction(facilityId: string) {
  await requireFacilityOwner(facilityId);
  return prisma.ticketPrice.findMany({
    where: {
      ticketType: { category: { facilityId }, isActive: true },
      isActive: true,
    },
    include: {
      ticketType: {
        select: {
          title: true,
          category: { select: { title: true } },
        },
      },
    },
    orderBy: [{ ticketType: { displayOrder: "asc" } }, { displayOrder: "asc" }],
  });
}

export async function updateTicketPriceAction(
  priceId: string,
  data: { price?: number; isActive?: boolean },
  facilityId: string,
) {
  await requireFacilityOwner(facilityId);
  return prisma.ticketPrice.update({ where: { id: priceId }, data });
}

export async function getOwnerSalesAction(facilityId: string, days: number = 30) {
  await requireFacilityOwner(facilityId);
  const since = new Date(Date.now() - days * 86400000);
  return prisma.transaction.findMany({
    where: { facilityId, createdAt: { gte: since }, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      totalAmount: true,
      createdAt: true,
      ticketDetails: true,
      issuedTickets: {
        select: {
          id: true,
          ticketPrice: {
            select: {
              price: true,
              ticketType: {
                select: { title: true, category: { select: { title: true } } },
              },
            },
          },
        },
      },
    },
  });
}

export interface OwnerAnalytics {
  totalViews: number;
  views7d: number;
  totalSales: number;
  sales7d: number;
  totalRevenue: number;
  revenue7d: number;
  conversionRate: number;
  topTicketTypes: { title: string; count: number; revenue: number }[];
  dailyBreakdown: { date: string; sales: number; revenue: number }[];
}

export async function getOwnerAnalyticsAction(
  facilityId: string,
  days: number = 30,
): Promise<OwnerAnalytics> {
  await requireFacilityOwner(facilityId);

  const [views, sales] = await Promise.all([
    getFacilityViews(facilityId, days),
    getOwnerSalesAction(facilityId, days),
  ]);

  const totalViews = views.reduce((sum, d) => sum + d.count, 0);
  const views7d = views.slice(-7).reduce((sum, d) => sum + d.count, 0);

  const totalSales = sales.length;
  const sales7d = sales.filter((s) => s.createdAt.getTime() > Date.now() - 7 * 86400000).length;

  const totalRevenue = sales.reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
  const revenue7d = sales
    .filter((s) => s.createdAt.getTime() > Date.now() - 7 * 86400000)
    .reduce((sum, tx) => sum + Number(tx.totalAmount), 0);

  // Conversion rate: sales / views over the full period
  const conversionRate = totalViews > 0 ? totalSales / totalViews : 0;

  // Top ticket types aggregation
  const ticketMap = new Map<string, { count: number; revenue: number }>();
  for (const tx of sales) {
    for (const ticket of tx.issuedTickets) {
      const title = ticket.ticketPrice?.ticketType?.title ?? "Nepoznato";
      const existing = ticketMap.get(title) ?? { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += Number(ticket.ticketPrice?.price ?? 0);
      ticketMap.set(title, existing);
    }
  }
  const topTicketTypes = [...ticketMap.entries()]
    .map(([title, data]) => ({ title, count: data.count, revenue: data.revenue }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Daily breakdown (last 30 days)
  const dayMap = new Map<string, { sales: number; revenue: number }>();
  for (const tx of sales) {
    const key = tx.createdAt.toISOString().slice(0, 10);
    const existing = dayMap.get(key) ?? { sales: 0, revenue: 0 };
    existing.sales += 1;
    existing.revenue += Number(tx.totalAmount);
    dayMap.set(key, existing);
  }

  const dailyBreakdown: { date: string; sales: number; revenue: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const data = dayMap.get(key) ?? { sales: 0, revenue: 0 };
    dailyBreakdown.push({ date: key, ...data });
  }

  return {
    totalViews,
    views7d,
    totalSales,
    sales7d,
    totalRevenue,
    revenue7d,
    conversionRate,
    topTicketTypes,
    dailyBreakdown,
  };
}
