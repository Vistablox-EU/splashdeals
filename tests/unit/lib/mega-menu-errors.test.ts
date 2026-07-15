import { describe, expect, it } from "vitest";
import {
  megaMenuLoadFailedGenericMessage,
  megaMenuLoadFailedMessage,
} from "@/lib/layout/mega-menu-errors";

describe("megaMenuLoadFailedMessage", () => {
  it("uses dictionary when present", () => {
    expect(
      megaMenuLoadFailedMessage({ mega_menu: { load_failed: "Navigacija nije dostupna" } }),
    ).toBe("Navigacija nije dostupna");
  });

  it("falls back to Serbian, never English", () => {
    const msg = megaMenuLoadFailedMessage(null);
    expect(msg).toMatch(/navigacije|uspelo|meni/i);
    expect(msg.toLowerCase()).not.toContain("failed");
  });
});

describe("megaMenuLoadFailedGenericMessage", () => {
  it("ignores English Error.message and uses Serbian fallback", () => {
    const msg = megaMenuLoadFailedGenericMessage(null, new Error("Failed to load menu"));
    expect(msg.toLowerCase()).not.toContain("failed");
    expect(msg).toMatch(/menija|uspelo/i);
  });

  it("keeps Serbian Error.message", () => {
    expect(megaMenuLoadFailedGenericMessage(null, new Error("Mreža nije dostupna"))).toBe(
      "Mreža nije dostupna",
    );
  });
});
