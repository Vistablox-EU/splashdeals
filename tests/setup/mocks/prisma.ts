import { vi } from "vitest";

/**
 * Shared Prisma mock for integration tests.
 * Covers the most commonly used models and methods.
 * Extend this as new query patterns are tested.
 */
export const createPrismaMock = () => ({
  prisma: {
    facility: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    transaction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    facilityMedia: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
});
