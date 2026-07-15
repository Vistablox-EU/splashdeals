import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  deleteMany: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/app/(server)/lib/prisma", () => ({
  prisma: {
    cartSession: {
      findMany: mocks.findMany,
      delete: mocks.delete,
    },
    cartSessionItem: {
      deleteMany: mocks.deleteMany,
    },
  },
}));

import { GET } from "@/app/(server)/api/cron/prune-guest-carts/route";

describe("guest cart prune cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    mocks.findMany.mockResolvedValue([{ id: "guest-1" }]);
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    mocks.delete.mockResolvedValue({ id: "guest-1" });
  });

  it("fails closed when CRON_SECRET is missing", async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(new Request("https://splashdeals.test/api/cron/prune-guest-carts"));
    expect(response.status).toBe(500);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("deletes only expired unlocked guest carts", async () => {
    const response = await GET(
      new Request("https://splashdeals.test/api/cron/prune-guest-carts", {
        headers: { authorization: "Bearer cron-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          guestTokenHash: { not: null },
          userId: null,
          locked: false,
        }),
      }),
    );
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { cartId: "guest-1" } });
    expect(mocks.delete).toHaveBeenCalledWith({ where: { id: "guest-1" } });
  });
});
