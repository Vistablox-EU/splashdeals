-- Phase 2 checkout/payment integrity.
-- Existing transactions remain valid: cart/campaign bindings are nullable, financial
-- snapshot columns have non-destructive defaults, and legacy Stripe sessions remain intact.

ALTER TABLE "sales"."Transaction"
  ADD COLUMN "campaignId" TEXT,
  ADD COLUMN "cartId" TEXT,
  ADD COLUMN "cartVersion" INTEGER,
  ADD COLUMN "checkoutExpiresAt" TIMESTAMP(3),
  ADD COLUMN "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "holderName" TEXT,
  ADD COLUMN "holderPhotoUrl" TEXT,
  ADD COLUMN "promoCode" TEXT,
  ADD COLUMN "promoUsageCounted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "subtotalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "stripeSession" DROP NOT NULL;

ALTER TABLE "sales"."CartSession"
  ADD COLUMN "activeCheckoutTransactionId" TEXT,
  ADD COLUMN "lockExpiresAt" TIMESTAMP(3),
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Transaction_status_checkoutExpiresAt_idx"
  ON "sales"."Transaction"("status", "checkoutExpiresAt");

CREATE INDEX "Transaction_cartId_idx"
  ON "sales"."Transaction"("cartId");

CREATE INDEX "Transaction_campaignId_status_idx"
  ON "sales"."Transaction"("campaignId", "status");

CREATE UNIQUE INDEX "CartSession_activeCheckoutTransactionId_key"
  ON "sales"."CartSession"("activeCheckoutTransactionId");

ALTER TABLE "sales"."Transaction"
  ADD CONSTRAINT "Transaction_cartId_fkey"
  FOREIGN KEY ("cartId") REFERENCES "sales"."CartSession"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales"."Transaction"
  ADD CONSTRAINT "Transaction_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "marketing"."campaigns"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
