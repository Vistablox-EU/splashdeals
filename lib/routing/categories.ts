/**
 * 🗂️ Splashdeals Category Registry
 * Single source of truth for all facility categories.
 * Maps URL slugs → display names → database values.
 */

// Serbian slugs (original — canonical)
// English slugs (alternative — for /en/ prefixed URLs)
export const CATEGORIES = {
  "akva-parkovi": {
    name: "Akva Parkovi",
    dbValues: ["Akva Park"],
    enSlug: "aqua-parks",
    enName: "Aqua Parks",
  },
  "termalne-rivijere": {
    name: "Termalne Rivijere",
    dbValues: ["Termalna Rivijera"],
    enSlug: "thermal-rivieras",
    enName: "Thermal Rivieras",
  },
  bazeni: {
    name: "Bazeni",
    dbValues: ["Bazen", "Otvoreni Bazen", "Zatvoreni Bazen", "Javni Bazen"],
    enSlug: "pools",
    enName: "Pools",
  },
  banje: {
    name: "Banje",
    dbValues: ["Banja"],
    enSlug: "spas",
    enName: "Spas",
  },
  "wellness-i-spa": {
    name: "Wellness i Spa",
    dbValues: ["Wellness i Spa"],
    enSlug: "wellness-and-spa",
    enName: "Wellness & Spa",
  },
  jezera: {
    name: "Jezera",
    dbValues: ["Jezero"],
    enSlug: "lakes",
    enName: "Lakes",
  },
  "plaze-i-kupalista": {
    name: "Plaže i Kupališta",
    dbValues: ["Gradska Plaža", "Kupalište", "Reka"],
    enSlug: "beaches-and-bathing",
    enName: "Beaches & Bathing Areas",
  },
  "vodeni-sportovi": {
    name: "Vodeni Sportovi",
    dbValues: ["Vodeni Sport", "Rafting"],
    enSlug: "water-sports",
    enName: "Water Sports",
  },
} as const;

export type CategorySlug = keyof typeof CATEGORIES;

/**
 * Reverse lookup: English slug → Serbian slug.
 * E.g. "aqua-parks" → "akva-parkovi"
 */
const EN_TO_SR: Record<string, CategorySlug> = {};
for (const [sr, cfg] of Object.entries(CATEGORIES)) {
  if (cfg.enSlug) {
    EN_TO_SR[cfg.enSlug] = sr as CategorySlug;
  }
}

/**
 * Resolve a slug to the canonical Serbian category key.
 * Accepts both Serbian and English slugs.
 * E.g. "akva-parkovi" → "akva-parkovi", "aqua-parks" → "akva-parkovi"
 */
export function resolveCategoryKey(slug: string): string | undefined {
  const lower = slug.toLowerCase();
  if (lower in CATEGORIES) return lower;
  const mapped = EN_TO_SR[lower];
  if (mapped) return mapped;
  return undefined;
}

/**
 * Convert a URL slug to the first DB category value for querying.
 * Accepts both Serbian and English slugs.
 * E.g. "akva-parkovi" → "Akva Park" or "aqua-parks" → "Akva Park"
 */
export function slugToDbValue(slug: string): string | undefined {
  const key = resolveCategoryKey(slug);
  return key ? CATEGORIES[key as CategorySlug]?.dbValues?.[0] : undefined;
}

/**
 * Get the display name for a slug in the given locale.
 * Serbian: "akva-parkovi" → "Akva Parkovi"
 * English: "akva-parkovi" → "Aqua Parks" or "aqua-parks" → "Aqua Parks"
 */
export function slugToName(slug: string, locale: "sr" | "en" = "sr"): string | undefined {
  const key = resolveCategoryKey(slug);
  if (!key) return undefined;
  const cat = CATEGORIES[key as CategorySlug];
  if (locale === "en" && cat.enName) return cat.enName;
  return cat.name;
}

/**
 * Get the locale-appropriate slug for a Serbian category key.
 * E.g. { category: "akva-parkovi", locale: "en" } → "aqua-parks"
 */
export function getLocalizedSlug(category: string, locale: "sr" | "en" = "sr"): string {
  const cat = CATEGORIES[category as CategorySlug];
  if (!cat) return category;
  if (locale === "en" && cat.enSlug) return cat.enSlug;
  return category;
}

/**
 * Convert a DB category value back to the Serbian URL slug.
 * E.g. "Akva Park" → "akva-parkovi"
 */
export function dbValueToSlug(dbValue: string): string | undefined {
  const entry = Object.entries(CATEGORIES).find(([, v]) =>
    v.dbValues.some((dv) => dv.toLowerCase() === dbValue.toLowerCase()),
  );
  return entry?.[0];
}

/**
 * Check if a slug is a known category (in any locale).
 */
export function isKnownCategory(slug: string): boolean {
  const lower = slug.toLowerCase();
  return lower in CATEGORIES || lower in EN_TO_SR;
}

/**
 * Get all canonical (Serbian) category slugs.
 */
export function getAllSlugs(): CategorySlug[] {
  return Object.keys(CATEGORIES) as CategorySlug[];
}

/**
 * Get all English category slugs.
 */
export function getAllEnglishSlugs(): string[] {
  return Object.values(CATEGORIES)
    .map((c) => c.enSlug)
    .filter(Boolean) as string[];
}
