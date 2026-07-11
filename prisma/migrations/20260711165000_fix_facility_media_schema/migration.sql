-- Fix FacilityMedia schema drift
-- Columns (isHero, isCardBackground, isGalleryVisible, originalUrl, focalPoint) were
-- added via prisma db push but never captured in a proper migration.
-- The 20260709_add_facility_media_indexes migration was marked as applied but its
-- index on isHero fails on clean databases because the column was never added.

-- Add missing columns (safe: IF NOT EXISTS is handled by Postgres)
ALTER TABLE "partners"."FacilityMedia" ADD COLUMN IF NOT EXISTS "originalUrl" TEXT;
ALTER TABLE "partners"."FacilityMedia" ADD COLUMN IF NOT EXISTS "isHero" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "partners"."FacilityMedia" ADD COLUMN IF NOT EXISTS "isCardBackground" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "partners"."FacilityMedia" ADD COLUMN IF NOT EXISTS "isGalleryVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "partners"."FacilityMedia" ADD COLUMN IF NOT EXISTS "focalPoint" TEXT;

-- Add indexes (safe: IF NOT EXISTS is supported in PG for indexes)
CREATE INDEX IF NOT EXISTS "FacilityMedia_facilityId_order_idx"
  ON "partners"."FacilityMedia" ("facilityId", "order");
CREATE INDEX IF NOT EXISTS "FacilityMedia_facilityId_isHero_idx"
  ON "partners"."FacilityMedia" ("facilityId", "isHero");
CREATE INDEX IF NOT EXISTS "FacilityMedia_facilityId_isGalleryVisible_idx"
  ON "partners"."FacilityMedia" ("facilityId", "isGalleryVisible");
