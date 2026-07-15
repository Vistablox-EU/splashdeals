import { describe, expect, it } from "vitest";
import {
  getCheckoutTerminalMessage,
  hasExceededCheckoutStatusPolls,
  isCheckoutTerminalStatus,
  MAX_CHECKOUT_STATUS_POLLS,
  shouldRetryCheckoutStatus,
} from "@/app/(web)/success/_components/success-state";

const TERMINAL_MESSAGES = {
  FAILED: "Plaćanje nije uspelo. Vaša korpa je sačuvana.",
  CANCELLED: "Plaćanje je otkazano. Vaša korpa je sačuvana.",
  EXPIRED: "Vreme za plaćanje je isteklo. Vaša korpa je sačuvana.",
  PAID_REVIEW:
    "Plaćanje je primljeno, ali je potrebna dodatna provera. Naš tim će vas kontaktirati.",
};

describe("success page checkout states", () => {
  it.each(["FAILED", "CANCELLED", "EXPIRED", "PAID_REVIEW"] as const)(
    "stops polling for terminal status %s and resolves message from dict",
    (status) => {
      expect(isCheckoutTerminalStatus(status)).toBe(true);
      expect(getCheckoutTerminalMessage(status, TERMINAL_MESSAGES)).toBe(TERMINAL_MESSAGES[status]);
    },
  );

  it("returns null for terminal status when dict messages are missing", () => {
    expect(getCheckoutTerminalMessage("FAILED")).toBeNull();
    expect(getCheckoutTerminalMessage("FAILED", {})).toBeNull();
  });

  it("continues polling while fulfillment is pending", () => {
    expect(isCheckoutTerminalStatus("PENDING")).toBe(false);
    expect(getCheckoutTerminalMessage("PENDING", TERMINAL_MESSAGES)).toBeNull();
  });

  it.each([401, 403, 404])("stops polling for non-retryable HTTP status %s", (status) => {
    expect(shouldRetryCheckoutStatus(status)).toBe(false);
  });

  it.each([429, 500, 502, 503])("retries transient HTTP status %s", (status) => {
    expect(shouldRetryCheckoutStatus(status)).toBe(true);
  });

  it("bounds PENDING polling attempts", () => {
    expect(hasExceededCheckoutStatusPolls(MAX_CHECKOUT_STATUS_POLLS - 1)).toBe(false);
    expect(hasExceededCheckoutStatusPolls(MAX_CHECKOUT_STATUS_POLLS)).toBe(true);
  });
});
