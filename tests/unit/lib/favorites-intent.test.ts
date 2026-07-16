import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  consumeFavoriteIntent,
  saveFavoriteIntent,
  FAVORITE_INTENT_KEY,
} from "@/lib/auth/favorites-intent";

const store = new Map<string, string>();

describe("favorites intent", () => {
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saves and consumes intent once", () => {
    saveFavoriteIntent({ facilityId: "fac-1", facilitySlug: "petroland" });
    const first = consumeFavoriteIntent();
    expect(first?.facilityId).toBe("fac-1");
    expect(first?.facilitySlug).toBe("petroland");
    expect(consumeFavoriteIntent()).toBeNull();
    expect(store.get(FAVORITE_INTENT_KEY)).toBeUndefined();
  });

  it("drops expired intent", () => {
    const old = {
      facilityId: "fac-2",
      createdAt: Date.now() - 20 * 60 * 1000,
    };
    store.set(FAVORITE_INTENT_KEY, JSON.stringify(old));
    expect(consumeFavoriteIntent(15 * 60 * 1000)).toBeNull();
  });
});
