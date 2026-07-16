/**
 * One-shot favorite intent after login (sessionStorage).
 * Used so unauth heart → prijava → return can complete the favorite action.
 */

export const FAVORITE_INTENT_KEY = "sd_favorite_intent";

export type FavoriteIntent = {
  facilityId: string;
  facilitySlug?: string;
  createdAt: number;
};

function storage(): Storage | null {
  try {
    if (typeof globalThis === "undefined") return null;
    const s = (globalThis as { sessionStorage?: Storage }).sessionStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

export function saveFavoriteIntent(intent: Omit<FavoriteIntent, "createdAt">): void {
  const ss = storage();
  if (!ss) return;
  try {
    const payload: FavoriteIntent = { ...intent, createdAt: Date.now() };
    ss.setItem(FAVORITE_INTENT_KEY, JSON.stringify(payload));
  } catch {
    // private mode / quota — non-fatal
  }
}

export function consumeFavoriteIntent(maxAgeMs = 15 * 60 * 1000): FavoriteIntent | null {
  const ss = storage();
  if (!ss) return null;
  try {
    const raw = ss.getItem(FAVORITE_INTENT_KEY);
    if (!raw) return null;
    ss.removeItem(FAVORITE_INTENT_KEY);
    const parsed = JSON.parse(raw) as FavoriteIntent;
    if (!parsed?.facilityId) return null;
    if (Date.now() - (parsed.createdAt || 0) > maxAgeMs) return null;
    return parsed;
  } catch {
    return null;
  }
}
