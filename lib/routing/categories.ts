/**
 * 🗂️ Splashdeals Category Registry
 * Single source of truth for all facility categories.
 * Maps URL slugs → display names → database values.
 */
export const CATEGORIES = {
  "akva-parkovi": {
    name: "Akva Parkovi",
    dbValues: ["Akva Park", "Waterpark"],
  },
  "bazeni": {
    name: "Bazeni",
    dbValues: ["Bazen", "Public Pool", "Swimming Pool"],
  },
  "wellness-i-spa": {
    name: "Wellness i Spa",
    dbValues: ["Wellness i Spa"],
  },
} as const;

export type CategorySlug = keyof typeof CATEGORIES;

/**
 * Convert a URL slug to the first DB category value for querying.
 * E.g. "akva-parkovi" → "Waterpark"
 */
export function slugToDbValue(slug: string): string | undefined {
  return CATEGORIES[slug as CategorySlug]?.dbValues?.[0];
}

/**
 * Convert a URL slug to the human-readable display name.
 * E.g. "akva-parkovi" → "Akva Parkovi"
 */
export function slugToName(slug: string): string | undefined {
  return CATEGORIES[slug as CategorySlug]?.name;
}

/**
 * Convert a DB category value back to the URL slug.
 * E.g. "Waterpark" → "akva-parkovi"
 */
export function dbValueToSlug(dbValue: string): string | undefined {
  const entry = Object.entries(CATEGORIES).find(
    ([, v]) => v.dbValues.some((dv) => dv.toLowerCase() === dbValue.toLowerCase())
  );
  return entry?.[0];
}

/**
 * Check if a slug is a known category.
 */
export function isKnownCategory(slug: string): boolean {
  return slug in CATEGORIES;
}

/**
 * Get all known category slugs.
 */
export function getAllSlugs(): CategorySlug[] {
  return Object.keys(CATEGORIES) as CategorySlug[];
}
