import { describe, expect, it } from "vitest";
import {
  facilityListOrderBy,
  parseFacilityListLimit,
  parseFacilityListOrder,
  parseFacilityListPage,
  parseFacilityListSort,
} from "@/lib/admin/facilities-list-params";

describe("facilities-list-params", () => {
  it("clamps invalid/negative pages to 1", () => {
    expect(parseFacilityListPage(undefined)).toBe(1);
    expect(parseFacilityListPage("0")).toBe(1);
    expect(parseFacilityListPage("-3")).toBe(1);
    expect(parseFacilityListPage("abc")).toBe(1);
    expect(parseFacilityListPage("2.9")).toBe(2);
    expect(parseFacilityListPage("12")).toBe(12);
  });

  it("allowlists page sizes 15/25/50", () => {
    expect(parseFacilityListLimit(undefined)).toBe(15);
    expect(parseFacilityListLimit("25")).toBe(25);
    expect(parseFacilityListLimit("50")).toBe(50);
    expect(parseFacilityListLimit("-5")).toBe(15);
    expect(parseFacilityListLimit("99999")).toBe(15);
    expect(parseFacilityListLimit("foo")).toBe(15);
  });

  it("parses sort keys and defaults to createdAt", () => {
    expect(parseFacilityListSort("name")).toBe("name");
    expect(parseFacilityListSort("city")).toBe("city");
    expect(parseFacilityListSort("evil")).toBe("createdAt");
    expect(parseFacilityListSort(undefined)).toBe("createdAt");
  });

  it("parses order asc|desc defaulting to desc", () => {
    expect(parseFacilityListOrder("asc")).toBe("asc");
    expect(parseFacilityListOrder("desc")).toBe("desc");
    expect(parseFacilityListOrder("nope")).toBe("desc");
  });

  it("builds prisma orderBy", () => {
    expect(facilityListOrderBy("name", "asc")).toEqual({ name: "asc" });
    expect(facilityListOrderBy("createdAt", "desc")).toEqual({ createdAt: "desc" });
  });
});
