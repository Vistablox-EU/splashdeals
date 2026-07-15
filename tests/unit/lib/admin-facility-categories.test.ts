import { describe, expect, it } from "vitest";
import { getAdminCategoryOptions, getAllDbCategoryValues } from "@/lib/routing/categories";

describe("admin facility categories", () => {
  it("includes canonical public taxonomy values", () => {
    const values = getAllDbCategoryValues();
    expect(values).toContain("Akva Park");
    expect(values).toContain("Otvoreni Bazen");
    expect(values).not.toContain("Waterpark");
    expect(values).not.toContain("Public Pool");
  });

  it("builds admin select options from CATEGORIES", () => {
    const opts = getAdminCategoryOptions();
    expect(opts.length).toBeGreaterThan(5);
    expect(opts.every((o) => o.value && o.label && o.group)).toBe(true);
  });
});
