import { describe, expect, it } from "vitest";
import {
  getCheckoutTerminalMessage,
  isCheckoutTerminalStatus,
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
});
