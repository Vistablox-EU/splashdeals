import { describe, expect, it } from "vitest";
import {
  buildPrijavaUrl,
  buildSuccessPrijavaUrl,
  buildSuccessReturnPath,
  isSafeCallbackPath,
} from "@/lib/auth/callback-url";

describe("auth callback URL helpers", () => {
  it("accepts only same-origin relative paths", () => {
    expect(isSafeCallbackPath("/cart")).toBe(true);
    expect(isSafeCallbackPath("/success?session_id=cs_x")).toBe(true);
    expect(isSafeCallbackPath("//evil.com")).toBe(false);
    expect(isSafeCallbackPath("https://evil.com")).toBe(false);
    expect(isSafeCallbackPath(null)).toBe(false);
  });

  it("builds prijava URL with encoded callbackUrl", () => {
    expect(buildPrijavaUrl("/cart")).toBe("/prijava?callbackUrl=%2Fcart");
  });

  it("preserves success session_id in return path", () => {
    expect(buildSuccessReturnPath("cs_test_123")).toBe("/success?session_id=cs_test_123");
    expect(buildSuccessPrijavaUrl("cs_test_123")).toBe(
      "/prijava?callbackUrl=%2Fsuccess%3Fsession_id%3Dcs_test_123",
    );
  });

  it("falls back safely for missing session_id", () => {
    expect(buildSuccessReturnPath(undefined)).toBe("/success");
    expect(buildSuccessPrijavaUrl(null)).toBe("/prijava?callbackUrl=%2Fsuccess");
  });
});
