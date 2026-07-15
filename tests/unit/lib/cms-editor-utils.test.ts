import { describe, expect, it } from "vitest";
import {
  countImagesWithoutAlt,
  formatScheduledDate,
  toDatetimeLocal,
} from "@/app/(dashboard)/admin/cms/_lib/cms-editor-utils";

describe("cms-editor-utils", () => {
  it("counts images missing alt", () => {
    expect(countImagesWithoutAlt('<img src="a.jpg"><img src="b.jpg" alt="ok">')).toBe(1);
    expect(countImagesWithoutAlt("")).toBe(0);
  });

  it("formats datetime-local values", () => {
    const v = toDatetimeLocal("2026-07-15T12:30:00.000Z");
    expect(v).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("formats scheduled date for SR display", () => {
    const out = formatScheduledDate("2026-07-15T10:05:00");
    expect(out).toContain("2026");
    expect(out).toContain("u");
  });
});
