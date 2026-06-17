/**
 * 🌐 Nested dictionary type for localized string bundles.
 * Content dictionaries can be 2-3 levels deep with string values at leaves.
 */
export type Dict = { [key: string]: string | string[] | Dict };
