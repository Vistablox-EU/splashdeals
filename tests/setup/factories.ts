import { DayType } from "@prisma/client";

/**
 * Test data factories for building consistent test fixtures.
 * Extend as new entity types need testing.
 */

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export const buildFacility = (overrides: DeepPartial<any> = {}) => ({
  id: "facility-1",
  name: "Test Facility",
  slug: "test-facility",
  description: "A test facility",
  isActive: true,
  isPublished: true,
  city: "Belgrade",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const buildTimeSlot = (overrides: DeepPartial<any> = {}) => ({
  id: "slot-1",
  facilityId: "facility-1",
  dayType: DayType.WEEKDAY as DayType,
  type: "FULL_DAY" as const,
  label: "Full Day",
  openingTime: "09:00",
  closingTime: "17:00",
  basePrice: 500,
  maxCapacity: 100,
  isActive: true,
  requiresTicketSelection: true,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
