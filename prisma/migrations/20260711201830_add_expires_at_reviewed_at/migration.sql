-- AlterTable: add expiresAt and reviewedAt to BlogPost and Page
ALTER TABLE "marketing"."blog_posts" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "marketing"."blog_posts" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "marketing"."pages" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "marketing"."pages" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
