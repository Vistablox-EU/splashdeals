-- CreateTable: Person model (marketing schema)
CREATE TABLE "marketing"."persons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "photo" TEXT,
    "email" TEXT,
    "twitterUrl" TEXT,
    "facebookUrl" TEXT,
    "linkedinUrl" TEXT,
    "instagramUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "persons_slug_key" ON "marketing"."persons"("slug");
CREATE INDEX "persons_slug_idx" ON "marketing"."persons"("slug");

-- AlterTable: Add coverImageAlt and authorPersonId to BlogPost
ALTER TABLE "marketing"."blog_posts" ADD COLUMN "coverImageAlt" TEXT;
ALTER TABLE "marketing"."blog_posts" ADD COLUMN "authorPersonId" TEXT;
ALTER TABLE "marketing"."blog_posts" ADD CONSTRAINT "blog_posts_authorPersonId_fkey" FOREIGN KEY ("authorPersonId") REFERENCES "marketing"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Remove duplicate focusKeyword (keeping the first occurrence already in schema)
-- focusKeyword column was present in an intermediate version of the schema but removed in favor of schemaMarkup
