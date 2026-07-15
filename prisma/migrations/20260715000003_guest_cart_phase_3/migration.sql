-- Phase 3 guest cart ownership.
-- Stacks on Phase 1 + Phase 2 cart/checkout integrity.
-- Enforces exactly one cart principal: authenticated user XOR guest token hash.

ALTER TABLE "sales"."CartSession"
  ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "sales"."CartSession"
  ADD COLUMN IF NOT EXISTS "guestTokenHash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "CartSession_guestTokenHash_key"
  ON "sales"."CartSession"("guestTokenHash");

CREATE INDEX IF NOT EXISTS "CartSession_expiresAt_idx"
  ON "sales"."CartSession"("expiresAt");

ALTER TABLE "sales"."CartSession"
  DROP CONSTRAINT IF EXISTS "CartSession_one_principal";

ALTER TABLE "sales"."CartSession"
  ADD CONSTRAINT "CartSession_one_principal"
  CHECK (
    ("userId" IS NOT NULL AND "guestTokenHash" IS NULL)
    OR ("userId" IS NULL AND "guestTokenHash" IS NOT NULL)
  );

ALTER TABLE "sales"."CartRateLimit"
  RENAME COLUMN "userId" TO "principalKey";

ALTER INDEX IF EXISTS "sales"."CartRateLimit_userId_key"
  RENAME TO "CartRateLimit_principalKey_key";
