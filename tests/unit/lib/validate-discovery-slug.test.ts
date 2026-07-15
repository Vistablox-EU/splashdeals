import { describe, expect, it } from "vitest";
import { getDiscoverySlugValidation } from "@/lib/routing/discovery-slug";

describe("getDiscoverySlugValidation", () => {
  const facility = {
    category: "Akva Park",
    slug: "petroland",
    marketplaceCities: [{ city: { slug: "novi-sad" } }],
  };

  it("accepts the canonical category slug", () => {
    const result = getDiscoverySlugValidation("akva-parkovi", facility);
    expect(result.valid).toBe(true);
    expect(result.canonicalPath).toBe("/petroland");
  });

  it("accepts a marketplace city slug", () => {
    const result = getDiscoverySlugValidation("novi-sad", facility);
    expect(result.valid).toBe(true);
  });

  it("rejects an invalid discovery slug without throwing", () => {
    const result = getDiscoverySlugValidation("bazen", facility);
    expect(result.valid).toBe(false);
    expect(result.canonicalPath).toBe("/petroland");
  });

  it("rejects garbage slugs and still returns a safe canonical path", () => {
    const result = getDiscoverySlugValidation("not-a-real-path", facility);
    expect(result.valid).toBe(false);
    expect(result.canonicalPath).toBe("/petroland");
  });
});
