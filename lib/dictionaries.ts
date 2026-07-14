import "server-only";

// Dictionary loader registry — register new locales here
const loaders = {
  rs: () => import("../dictionaries/rs.json").then((m) => m.default),
  en: () => import("../dictionaries/en.json").then((m) => m.default),
} as const;

type Locale = keyof typeof loaders;

/**
 * Deep merge `override` into `fallback` — override wins on conflicting
 * leaf keys, fallback fills in any gaps. Returns a new object; neither
 * source is mutated. Handles nested objects recursively.
 */
function deepMerge(
  fallback: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...fallback };

  for (const key of Object.keys(override)) {
    const overrideVal = override[key];
    const fallbackVal = fallback[key];

    if (
      overrideVal &&
      typeof overrideVal === "object" &&
      !Array.isArray(overrideVal) &&
      fallbackVal &&
      typeof fallbackVal === "object" &&
      !Array.isArray(fallbackVal)
    ) {
      // Both are plain objects — recurse
      result[key] = deepMerge(
        fallbackVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>,
      );
    } else {
      // Leaf or array — override wins, fallback if override is null/undefined
      result[key] = overrideVal ?? fallbackVal;
    }
  }

  return result;
}

/**
 * Load a dictionary for the given locale.
 *
 * - `getDictionary()` — returns the full Serbian dictionary (default)
 * - `getDictionary("en")` — returns the English dictionary with Serbian
 *   fallback for any missing keys
 *
 * When a non-rs locale is requested, the dictionary is deep-merged with
 * `rs.json` so that missing keys degrade gracefully to Serbian text.
 * This allows incremental translation without breaking the UI.
 */
export const getDictionary = async <L extends Locale = "rs">(
  locale: L = "rs" as L,
   
): Promise<any> => {
  const loader = loaders[locale];

  if (!loader) {
    console.warn(
      `Dictionary locale "${locale}" is not registered, falling back to rs.`,
      `Add a loader in lib/dictionaries.ts to support "${locale}".`,
    );
    return loaders.rs();
  }

  const primary = await loader();

  // Serbian is the source of truth — no fallback needed
  if (locale === "rs") return primary;

  // Non-rs locales get deep-merged with rs as the fallback
  const fallback = await loaders.rs();
  return deepMerge(fallback, primary);
};
