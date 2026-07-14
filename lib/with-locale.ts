/**
 * 🌐 Locale-aware data merging utility.
 *
 * Merges translations into entity data for multi-locale support.
 * Serbian is the source of truth — if no translation exists for the
 * requested locale, the original Serbian fields are returned as-is.
 *
 * Usage:
 *   const facility = await prisma.facility.findUnique({
 *     where: { slug },
 *     include: { translations: true },
 *   });
 *   const localized = withLocale(facility, facility.translations, locale);
 *   // localized.name is now in the requested locale (or Serbian fallback)
 */

import type { Locale } from "@/lib/locale";

/**
 * A translation row from any translation table.
 * Must have at minimum `locale` plus optional translated fields.
 */
interface Translation {
  locale: string;
  [key: string]: unknown;
}

/**
 * Merge translations into an entity.
 *
 * - "sr" locale → returns entity unchanged (no DB join needed)
 * - Any other locale → looks for a matching translation, overrides entity fields
 * - No translation found → returns entity as-is (Serbian fallback)
 *
 * @example
 *   const result = withLocale(facility, facility.translations, "en");
 *   // result.name is now in English (if translation exists)
 */
export function withLocale<T extends Record<string, unknown>, X extends Translation>(
  entity: T,
  translations: X[] | undefined | null,
  locale: Locale,
): T {
  // Serbian is the source of truth — no merge needed
  if (locale === "sr" || !translations || translations.length === 0) return entity;

  const t = translations.find((tr) => tr.locale === locale);
  if (!t) return entity; // No translation — fall back to Serbian

  // Merge translation fields into entity (translation overrides when present)
  const result = { ...entity };
  for (const [key, value] of Object.entries(t)) {
    if (
      key === "locale" ||
      key === "id" ||
      key.startsWith("facility") ||
      key.startsWith("post") ||
      key.startsWith("page")
    )
      continue;
    if (value !== null && value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

/**
 * Same as withLocale but works on arrays of entities.
 */
export function withLocaleMany<T extends Record<string, unknown>, X extends Translation>(
  entities: T[],
  getTranslations: (entity: T) => X[] | undefined | null,
  locale: Locale,
): T[] {
  if (locale === "sr") return entities;
  return entities.map((entity) => withLocale(entity, getTranslations(entity), locale));
}
