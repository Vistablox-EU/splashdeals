/**
 * 🌐 Nested dictionary type for localized string bundles.
 * Content dictionaries can be 2-3 levels deep with string values at leaves.
 */
// This shouldn't be `any` but the `Dict` type below is imported broadly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Dict = { [key: string]: any };
