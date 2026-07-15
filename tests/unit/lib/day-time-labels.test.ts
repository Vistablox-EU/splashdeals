import { describe, expect, it } from "vitest";
import { getDayTypeLabel, getTimeSlotLabel } from "@/lib/ticketing/day-time-labels";

describe("day-time labels", () => {
  it("resolves known day types", () => {
    expect(getDayTypeLabel("WEEKDAY")).toBe("Radni dan");
    expect(getDayTypeLabel("WEEKEND")).toBe("Vikend");
    expect(getDayTypeLabel(null)).toBe("Svi dani");
  });

  it("resolves known time slots", () => {
    expect(getTimeSlotLabel("AFTER_16H")).toBe("Posle 16h");
    expect(getTimeSlotLabel("THREE_HOUR")).toBe("3 sata");
    expect(getTimeSlotLabel(undefined)).toBe("Ceo dan");
  });

  it("allows dictionary overrides", () => {
    expect(getDayTypeLabel("WEEKDAY", { WEEKDAY: "Radnim danima" })).toBe("Radnim danima");
  });
});
