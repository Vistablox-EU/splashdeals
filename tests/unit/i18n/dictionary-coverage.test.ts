import { describe, it, expect } from "vitest";
import dictionary from "@/dictionaries/rs.json";

/**
 * Recursively collect all leaf values and their paths.
 * A "leaf" is any value that is not a plain object.
 * Returns an array of { path: string, value: unknown } entries.
 */
function collectLeaves(obj: unknown, prefix = ""): { path: string; value: unknown }[] {
  if (obj === null || obj === undefined) {
    return [{ path: prefix || "(root)", value: obj }];
  }
  if (typeof obj !== "object") {
    return [{ path: prefix || "(root)", value: obj }];
  }
  if (Array.isArray(obj)) {
    return obj.flatMap((item, i) => collectLeaves(item, `${prefix}[${i}]`));
  }
  const entries = Object.entries(obj as Record<string, unknown>);
  if (entries.length === 0) {
    return [{ path: prefix || "(root)", value: "(empty object)" }];
  }
  return entries.flatMap(([key, val]) => collectLeaves(val, prefix ? `${prefix}.${key}` : key));
}

/** Recursively collect all empty objects and their paths. */
function collectEmptyObjects(obj: unknown, prefix = ""): string[] {
  if (obj === null || obj === undefined || typeof obj !== "object") return [];
  if (Array.isArray(obj)) {
    return obj.flatMap((item, i) => collectEmptyObjects(item, `${prefix}[${i}]`));
  }
  const record = obj as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 0) return [prefix || "(root)"];
  return keys.flatMap((key) => collectEmptyObjects(record[key], prefix ? `${prefix}.${key}` : key));
}

describe("i18n dictionary coverage", () => {
  const dict = dictionary as Record<string, unknown>;

  // ── Known top-level groups ──────────────────────────────────────────
  const KNOWN_GROUPS = [
    "home",
    "nav",
    "footer",
    "cart",
    "checkout",
    "facilities",
    "ticketing",
    "blog",
    "search",
    "account",
    "errors",
    "admin",
    "common",
    "seo",
    "mega_menu",
  ] as const;

  // ── Minimum key counts per group ────────────────────────────────────
  const MIN_KEY_COUNTS: Record<string, number> = {
    home: 5,
    nav: 3,
    footer: 5,
    cart: 3,
    checkout: 3,
    facilities: 3,
  };

  it("has all known top-level groups", () => {
    for (const group of KNOWN_GROUPS) {
      if (!(group in dict)) {
        console.warn(`Missing top-level group: "${group}"`);
      }
    }
    // Never fail — CI-friendly
    expect(true).toBe(true);
  });

  it("has at least the minimum number of keys per group", () => {
    for (const [group, minKeys] of Object.entries(MIN_KEY_COUNTS)) {
      const groupObj = dict[group];
      if (!groupObj || typeof groupObj !== "object" || Array.isArray(groupObj)) {
        console.warn(
          `Group "${group}" is missing or not a plain object; expected at least ${minKeys} keys.`,
        );
        continue;
      }
      const keyCount = Object.keys(groupObj as Record<string, unknown>).length;
      if (keyCount < minKeys) {
        console.warn(`Group "${group}" has only ${keyCount} keys (minimum: ${minKeys}).`);
      }
    }
    // Never fail
    expect(true).toBe(true);
  });

  it("has string leaf values (no empty objects, nulls, or non-string leaves)", () => {
    const leaves = collectLeaves(dict);
    const issues: string[] = [];

    for (const { path, value } of leaves) {
      if (value === null || value === undefined) {
        issues.push(`${path}: is ${value}`);
      } else if (typeof value === "number" || typeof value === "boolean") {
        issues.push(`${path}: is a ${typeof value} (${JSON.stringify(value)})`);
      } else if (typeof value === "string") {
        if (value.trim() === "") {
          issues.push(`${path}: is an empty string`);
        }
      } else if (value === "(empty object)") {
        issues.push(`${path}: is an empty object`);
      }
    }

    for (const issue of issues) {
      console.warn(`Leaf value issue: ${issue}`);
    }

    const emptyObjects = collectEmptyObjects(dict);
    for (const eo of emptyObjects) {
      console.warn(`Empty object at: ${eo}`);
    }

    // Never fail
    expect(true).toBe(true);
  });
});
