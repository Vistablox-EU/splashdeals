import { describe, it, expect } from "vitest";
import {
  getDayType,
  resolveTicketsForDate,
  formatPrice,
  calculateMaxDiscount,
  type TicketPriceData,
} from "@/lib/utils/pricing";
import { DayType, TimeSlot } from "@prisma/client";

describe("pricing utilities", () => {
  describe("getDayType", () => {
    it("identifies weekends correctly", () => {
      // 2026-05-23 is Saturday
      expect(getDayType(new Date("2026-05-23"))).toBe(DayType.WEEKEND);
      // 2026-05-24 is Sunday
      expect(getDayType(new Date("2026-05-24"))).toBe(DayType.WEEKEND);
    });

    it("identifies weekdays correctly", () => {
      // 2026-05-22 is Friday
      expect(getDayType(new Date("2026-05-22"))).toBe(DayType.WEEKDAY);
      // 2026-05-19 is Tuesday
      expect(getDayType(new Date("2026-05-19"))).toBe(DayType.WEEKDAY);
    });
  });

  describe("resolveTicketsForDate", () => {
    const weekdayTicket: TicketPriceData = {
      id: "t1",
      price: 500,
      label: "Weekday",
      dayType: DayType.WEEKDAY,
      timeSlot: TimeSlot.FULL_DAY,
      isActive: true,
      displayOrder: 0,
      ticketTypeId: "tt1",
      saleStart: null,
      saleEnd: null,
    };

    const weekendTicket: TicketPriceData = {
      id: "t2",
      price: 800,
      label: "Weekend",
      dayType: DayType.WEEKEND,
      timeSlot: TimeSlot.FULL_DAY,
      isActive: true,
      displayOrder: 1,
      ticketTypeId: "tt1",
      saleStart: null,
      saleEnd: null,
    };

    it("resolves weekday tickets for a weekday date", () => {
      const date = new Date("2026-05-19"); // Tuesday
      const result = resolveTicketsForDate([weekdayTicket, weekendTicket], date);
      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(500);
    });

    it("resolves weekend tickets for a weekend date", () => {
      const date = new Date("2026-05-23"); // Saturday
      const result = resolveTicketsForDate([weekdayTicket, weekendTicket], date);
      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(800);
    });

    it("filters inactive tickets", () => {
      const inactive: TicketPriceData = {
        ...weekdayTicket,
        id: "t3",
        isActive: false,
      };
      const result = resolveTicketsForDate([weekdayTicket, inactive], new Date("2026-05-19"));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("t1");
    });
  });

  describe("formatPrice", () => {
    it("formats with default RSD currency", () => {
      expect(formatPrice(500)).toBe("500 RSD");
      expect(formatPrice(0)).toBe("0 RSD");
    });

    it("formats with a custom currency", () => {
      expect(formatPrice(500, "EUR")).toBe("500 EUR");
    });

    it("handles string price inputs", () => {
      expect(formatPrice("1000")).toBe("1000 RSD");
    });
  });

  describe("calculateMaxDiscount", () => {
    it("returns 0 for empty or undefined tickets", () => {
      expect(calculateMaxDiscount([])).toBe(0);
    });

    it("returns 0 when no tickets have discounts", () => {
      const tickets = [
        { isActive: true, price: 500, originalPrice: 500 },
        { isActive: true, price: 800, originalPrice: 800 },
      ];
      expect(calculateMaxDiscount(tickets)).toBe(0);
    });

    it("returns correct percentage for valid discounts", () => {
      const tickets = [
        { isActive: true, price: 400, originalPrice: 500 },
        { isActive: true, price: 600, originalPrice: 1200 },
      ];
      // 500→400 = 20%, 1200→600 = 50% → max is 50
      expect(calculateMaxDiscount(tickets)).toBe(50);
    });

    it("ignores inactive tickets", () => {
      const tickets = [
        { isActive: false, price: 250, originalPrice: 500 },
        { isActive: true, price: 400, originalPrice: 500 },
      ];
      expect(calculateMaxDiscount(tickets)).toBe(20);
    });
  });
});
