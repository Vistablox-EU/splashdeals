import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn(),
  transactionFindFirst: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/app/(server)/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/app/(server)/lib/prisma", () => ({
  prisma: { transaction: { findFirst: mocks.transactionFindFirst } },
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("next/server", () => ({
  connection: vi.fn(async () => undefined),
}));
vi.mock("next/dynamic", () => ({
  default: vi.fn(
    () =>
      function SuccessClientMock() {
        return null;
      },
  ),
}));
vi.mock("@/lib/dictionaries", () => ({
  getDictionary: vi.fn(async () => ({
    success: {
      metadata: { title: "Uspeh", description: "Opis" },
      access_denied: { title: "Pristup odbijen", description: "Niste prijavljeni." },
    },
  })),
}));

import SuccessPage from "@/app/(web)/success/page";

describe("success page authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(null);
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("redirects unauthenticated visitors before loading a transaction", async () => {
    await expect(
      SuccessPage({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({ session_id: "cs_private" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/prijava?callbackUrl=%2Fsuccess%3Fsession_id%3Dcs_private",
    );
    expect(mocks.transactionFindFirst).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated visitors without session_id to prijava with success return", async () => {
    await expect(
      SuccessPage({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledWith("/prijava?callbackUrl=%2Fsuccess");
  });
});
