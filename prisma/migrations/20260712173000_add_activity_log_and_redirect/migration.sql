-- CreateTable: ActivityLog (marketing schema)
CREATE TABLE "marketing"."activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "marketing"."activity_logs"("userId");
CREATE INDEX "activity_logs_action_idx" ON "marketing"."activity_logs"("action");
CREATE INDEX "activity_logs_createdAt_idx" ON "marketing"."activity_logs"("createdAt");

-- CreateTable: Redirect (marketing schema)
CREATE TABLE "marketing"."redirects" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 301,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redirects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "redirects_source_key" ON "marketing"."redirects"("source");
CREATE INDEX "redirects_source_isActive_idx" ON "marketing"."redirects"("source", "isActive");
