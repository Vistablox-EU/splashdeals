/**
 * 🌐 SEO Helper — hreflang alternates and locale-aware metadata.
 *
 * Provides utility functions for pages to easily add hreflang alternate
 * references to their generateMetadata() output.
 *
 * Usage:
 *   import { alternates } from "@/lib/seo";
 *
 *   export async function generateMetadata() {
 *     return {
 *       alternates: {
 *         canonical: "https://www.splashdeals.rs/facility-slug",
 *         languages: alternates("/facility-slug"),
 *       },
 *     };
 *   }
 */

const BASE_URL = "https://www.splashdeals.rs";

/**
 * Build hreflang alternates for a given path.
 *
 * - Serbian (default): bare path, e.g. /facility-slug
 * - English: /en/ prefix, e.g. /en/facility-slug
 * - x-default: same as Serbian (primary market)
 */
export function alternates(path: string): Record<string, string> {
  const clean = path.replace(/^\//, "").replace(/\/$/, "");
  const sr = clean ? `${BASE_URL}/${clean}` : BASE_URL;
  const en = clean ? `${BASE_URL}/en/${clean}` : `${BASE_URL}/en`;

  return {
    sr,
    en,
    "x-default": sr,
  };
}

/**
 * Generate common metadata fragments for public pages.
 * Extends the standard Next.js Metadata pattern with locale-aware alternates.
 */
export function pageMetadata(path: string) {
  return {
    alternates: {
      canonical: `${BASE_URL}/${path.replace(/^\//, "")}`,
      languages: alternates(path),
    },
  };
}
