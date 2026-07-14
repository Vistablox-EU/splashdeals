import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/(server)/lib/prisma", () => ({
  prisma: {
    facility: {
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    transaction: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/app/(server)/lib/auth-guards", () => ({
  requireSuperAdmin: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("facilities actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the server actions module", async () => {
    const mod = await import("@/app/(server)/actions/facilities");
    expect(mod.bulkUpdateFacilityStatusAction).toBeDefined();
    expect(mod.createFacilityAction).toBeDefined();
    expect(mod.deleteFacilityAction).toBeDefined();
  });
});
