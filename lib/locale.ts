/**
 * 🌐 Locale Resolution for Splashdeals.
 *
 * Splashdeals uses URL prefix-based locale detection:
 * - No prefix / bare path → Serbian (sr, default)
 * - /en/ prefix → English
 *
 * The Serbian locale is the source of truth and uses canonical
 * (prefix-free) URLs. English pages live under /en/.
 */

export const LOCALES = ["sr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "sr";

/**
 * Extract the locale from a URL slug array (Next.js catch-all params).
 *
 * `[...slug]` pages receive path segments as an array.
 * First segment being "en" means English, anything else is Serbian.
 *
 * Returns the detected locale and the remaining segments (without the locale prefix).
 *
 * @example
 *   parseLocaleSegments(["en", "aqua-parks"]) → { locale: "en", segments: ["aqua-parks"] }
 *   parseLocaleSegments(["akva-parkovi"]) → { locale: "sr", segments: ["akva-parkovi"] }
 */
export function parseLocaleSegments(slugs: string[]): { locale: Locale; segments: string[] } {
  if (slugs.length > 0 && slugs[0] === "en") {
    return { locale: "en", segments: slugs.slice(1) };
  }
  return { locale: "sr", segments: slugs };
}
