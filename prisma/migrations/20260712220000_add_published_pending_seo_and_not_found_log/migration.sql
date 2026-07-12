-- Add PUBLISHED_PENDING status to PostStatus enum
ALTER TYPE "marketing"."PostStatus" ADD VALUE IF NOT EXISTS 'PUBLISHED_PENDING';

-- Add focusKeyword column to blog_posts and pages
ALTER TABLE "marketing"."blog_posts" ADD COLUMN IF NOT EXISTS "focusKeyword" TEXT;
ALTER TABLE "marketing"."pages" ADD COLUMN IF NOT EXISTS "focusKeyword" TEXT;

-- Create NotFoundLog table for 404 monitoring
CREATE TABLE IF NOT EXISTS "marketing"."not_found_logs" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "not_found_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "not_found_logs_path_idx" ON "marketing"."not_found_logs"("path");
CREATE INDEX IF NOT EXISTS "not_found_logs_count_idx" ON "marketing"."not_found_logs"("count");
