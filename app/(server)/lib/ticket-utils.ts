import { DayType } from "@prisma/client";

export interface PriceWithDayType {
  dayType: string | null;
}

export function getDayTypeForDate(date: Date): "WEEKDAY" | "WEEKEND" {
  const day = date.getDay();
  if (day === 0 || day === 6) return "WEEKEND";
  return "WEEKDAY";
}

export function filterPricesByDate<T extends PriceWithDayType>(
  prices: T[],
  date: Date,
): T[] {
  const dayType = getDayTypeForDate(date);
  return prices.filter((p) => p.dayType === "ALL" || p.dayType === dayType);
}
