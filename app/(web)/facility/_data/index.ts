// ── Head module for the facility page route ──────────────────────
// Single source of truth for all <head> content: metadata + JSON-LD schemas.
// Route generateMetadata must call buildFacilityMetadata — not ShowcaseTemplate.generateMetadata
// (that export only 301-redirects legacy long paths).

export {
  buildFacilityMetadata,
  getFacility,
  buildTicketGroups,
  buildPriceLevelTiers,
  flattenActivePrices,
  getEntryTicketPrices,
  getEntryMinPrice,
} from "./metadata";
export type {
  FacilityWithIncludes,
  FlattenedPrice,
  TicketGroup,
  TicketGroupTier,
} from "./metadata";

export {
  getCategoryLabel,
  SITE_URL,
  buildFacilitySchema,
  buildAttractionSchema,
  buildBusinessSchema,
  buildProductSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildHowToSchema,
} from "./schemas";
export type {
  FacilitySchemaInput,
  TierEntry,
  BuildFacilitySchemaParams,
  FaqEntry,
  ReviewEntry,
} from "./schemas";

export {
  resolveSiteUrl,
  isEntryTicketPrice,
  buildOfferLabel,
  facilityIndexable,
  pickHeroPhotoUrl,
} from "./seo-utils";
