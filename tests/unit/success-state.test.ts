import { describe, expect, it } from "vitest";
import {
  CHECKOUT_STATUS_STILL_PROCESSING_MESSAGE,
  getCheckoutTerminalMessage,
  hasExceededCheckoutStatusPolls,
  isCheckoutTerminalStatus,
  MAX_CHECKOUT_STATUS_POLLS,
  shouldRetryCheckoutStatus,
} from "@/app/(web)/success/_components/success-state";

describe("success page checkout states", () => {
  it.each(["FAILED", "CANCELLED", "EXPIRED", "PAID_REVIEW"])(
    "stops polling for terminal status %s",
    (status) => {
      expect(isCheckoutTerminalStatus(status)).toBe(true);
      expect(getCheckoutTerminalMessage(status)).toBeTruthy();
    },
  );

  it("continues polling while fulfillment is pending", () => {
    expect(isCheckoutTerminalStatus("PENDING")).toBe(false);
    expect(getCheckoutTerminalMessage("PENDING")).toBeNull();
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
    expect(CHECKOUT_STATUS_STILL_PROCESSING_MESSAGE.length).toBeGreaterThan(20);
  });
});
