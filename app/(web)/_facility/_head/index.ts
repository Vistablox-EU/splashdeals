// ── Head module for the facility page route ──────────────────────
// Single source of truth for all <head> content: metadata + JSON-LD schemas.

export {
  buildFacilityMetadata,
  getFacility,
  buildTicketGroups,
  flattenActivePrices,
} from "./metadata";
export type {
  FacilityWithIncludes,
  FlattenedPrice,
  TicketGroup,
  TicketGroupTier,
} from "./metadata";

export {
  catLabelMap,
  SITE_URL,
  buildFacilitySchema,
  buildAttractionSchema,
  buildBusinessSchema,
  buildProductSchema,
  buildVideoSchema,
  buildBreadcrumbSchema,
} from "./schemas";
export type {
  FacilitySchemaInput,
  TierEntry,
  BuildFacilitySchemaParams,
} from "./schemas";
