import "server-only";

import { prisma } from "@/server/lib/prisma";

/**
 * Track a page view for a facility by incrementing or creating a daily counter.
 * Should be called from the facility's public page view handler.
 */
export async function trackPageView(facilityId: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.facilityPageView.upsert({
    where: { facilityId_date: { facilityId, date: today } },
    update: { count: { increment: 1 } },
    create: { facilityId, date: today, count: 1 },
  });
}

/**
 * Return daily view counts for a facility over the last N days.
 * Days with no views are included with count = 0.
 */
export async function getFacilityViews(facilityId: string, days: number) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days);

  const rows = await prisma.facilityPageView.findMany({
    where: { facilityId, date: { gte: since } },
    orderBy: { date: "asc" },
    select: { date: true, count: true },
  });

  // Fill in missing days with zero
  const viewMap = new Map<string, number>();
  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10);
    viewMap.set(key, row.count);
  }

  const result: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: viewMap.get(key) ?? 0 });
  }

  return result;
}
