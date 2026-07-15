import { describe, expect, it } from "vitest";
import { isCanonicalTicketAvailable } from "@/lib/cart/canonical-ticket";

function makeTicket(
  overrides: Partial<{
    isActive: boolean;
    typeActive: boolean;
    categoryActive: boolean;
    facilityStatus: string;
    validFrom: Date | null;
    validTo: Date | null;
    saleStart: Date | null;
    saleEnd: Date | null;
  }> = {},
) {
  return {
    isActive: overrides.isActive ?? true,
    validFrom: overrides.validFrom ?? null,
    validTo: overrides.validTo ?? null,
    saleStart: overrides.saleStart ?? null,
    saleEnd: overrides.saleEnd ?? null,
    ticketType: {
      isActive: overrides.typeActive ?? true,
      category: {
        isActive: overrides.categoryActive ?? true,
        facility: {
          status: overrides.facilityStatus ?? "ACTIVE",
        },
      },
    },
  };
}

describe("isCanonicalTicketAvailable", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");

  it("accepts an active ticket with active parents", () => {
    expect(isCanonicalTicketAvailable(makeTicket(), now)).toBe(true);
  });

  it("rejects null/undefined", () => {
    expect(isCanonicalTicketAvailable(null, now)).toBe(false);
    expect(isCanonicalTicketAvailable(undefined, now)).toBe(false);
  });

  it("rejects inactive ticket, type, category, or facility", () => {
    expect(isCanonicalTicketAvailable(makeTicket({ isActive: false }), now)).toBe(false);
    expect(isCanonicalTicketAvailable(makeTicket({ typeActive: false }), now)).toBe(false);
    expect(isCanonicalTicketAvailable(makeTicket({ categoryActive: false }), now)).toBe(false);
    expect(isCanonicalTicketAvailable(makeTicket({ facilityStatus: "DRAFT" }), now)).toBe(false);
  });

  it("rejects outside validity or sale windows", () => {
    expect(
      isCanonicalTicketAvailable(
        makeTicket({ validFrom: new Date("2026-08-01T00:00:00.000Z") }),
        now,
      ),
    ).toBe(false);
    expect(
      isCanonicalTicketAvailable(
        makeTicket({ validTo: new Date("2026-07-01T00:00:00.000Z") }),
        now,
      ),
    ).toBe(false);
    expect(
      isCanonicalTicketAvailable(
        makeTicket({ saleStart: new Date("2026-08-01T00:00:00.000Z") }),
        now,
      ),
    ).toBe(false);
    expect(
      isCanonicalTicketAvailable(
        makeTicket({ saleEnd: new Date("2026-07-01T00:00:00.000Z") }),
        now,
      ),
    ).toBe(false);
  });
});
