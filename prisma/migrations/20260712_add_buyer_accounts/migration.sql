-- Create identity schema and move tables from admin
CREATE SCHEMA IF NOT EXISTS identity;

-- Move tables from admin to identity
ALTER TABLE IF EXISTS admin."User" SET SCHEMA identity;
ALTER TABLE IF EXISTS admin."Account" SET SCHEMA identity;
ALTER TABLE IF EXISTS admin."Session" SET SCHEMA identity;
ALTER TABLE IF EXISTS admin."Verification" SET SCHEMA identity;
ALTER TABLE IF EXISTS admin."api_keys" SET SCHEMA identity;

-- Move enum
ALTER TYPE admin."UserRole" SET SCHEMA identity;

-- Add new columns to identity."User"
ALTER TABLE identity."User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE identity."User" ADD CONSTRAINT "User_stripeCustomerId_key" UNIQUE ("stripeCustomerId");

-- Add orderRef to sales."Transaction"
ALTER TABLE sales."Transaction" ADD COLUMN IF NOT EXISTS "orderRef" TEXT;
UPDATE sales."Transaction" SET "orderRef" = 'SD-' || TO_CHAR("createdAt", 'YYMMDD') || '-' || LPAD(CAST(ROW_NUMBER() OVER (ORDER BY "createdAt") AS TEXT), 4, '0') WHERE "orderRef" IS NULL;
ALTER TABLE sales."Transaction" ALTER COLUMN "orderRef" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_orderRef_key" ON sales."Transaction"("orderRef");
CREATE INDEX IF NOT EXISTS "Transaction_userId_createdAt_idx" ON sales."Transaction"("userId", "createdAt");

-- Add userId to sales."IssuedTicket"
ALTER TABLE sales."IssuedTicket" ADD COLUMN IF NOT EXISTS "userId" TEXT;
CREATE INDEX IF NOT EXISTS "IssuedTicket_userId_idx" ON sales."IssuedTicket"("userId");

-- Create UserFavorite table in partners schema
CREATE TABLE IF NOT EXISTS partners."user_favorites" (
    "userId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("userId", "facilityId")
);
CREATE INDEX IF NOT EXISTS "user_favorites_userId_idx" ON partners."user_favorites"("userId");
CREATE INDEX IF NOT EXISTS "user_favorites_facilityId_idx" ON partners."user_favorites"("facilityId");
ALTER TABLE partners."user_favorites" ADD CONSTRAINT "user_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES identity."User"("id") ON DELETE CASCADE;
ALTER TABLE partners."user_favorites" ADD CONSTRAINT "user_favorites_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES partners."Facility"("id") ON DELETE CASCADE;

-- Drop old admin schema if empty
DROP SCHEMA IF EXISTS admin;
