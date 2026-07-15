import { describe, expect, it } from "vitest";
import { buildPublicFacilityPath } from "@/lib/routing/public-facility-path";

describe("buildPublicFacilityPath", () => {
  it("returns /{slug}", () => {
    expect(buildPublicFacilityPath("petroland")).toBe("/petroland");
  });

  it("strips leading slashes", () => {
    expect(buildPublicFacilityPath("/petroland")).toBe("/petroland");
  });

  it("falls back to home for empty slug", () => {
    expect(buildPublicFacilityPath("")).toBe("/");
    expect(buildPublicFacilityPath("   ")).toBe("/");
  });
});
