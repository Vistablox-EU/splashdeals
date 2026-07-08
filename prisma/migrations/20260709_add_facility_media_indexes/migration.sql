-- Add indexes for FacilityMedia query performance
-- See: https://github.com/Damir-VistaBlox/splashdeals/issues/6

-- Index for gallery sorting: all media queries sort by facilityId + order
CREATE INDEX IF NOT EXISTS "FacilityMedia_facilityId_order_idx"
  ON "partners"."FacilityMedia" ("facilityId", "order");

-- Index for hero lookup: navigation queries filter by facilityId + isHero
CREATE INDEX IF NOT EXISTS "FacilityMedia_facilityId_isHero_idx"
  ON "partners"."FacilityMedia" ("facilityId", "isHero");

-- Index for public gallery visibility filter
CREATE INDEX IF NOT EXISTS "FacilityMedia_facilityId_isGalleryVisible_idx"
  ON "partners"."FacilityMedia" ("facilityId", "isGalleryVisible");
