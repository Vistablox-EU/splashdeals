-- CreateTable: CmsMedia (marketing schema)
CREATE TABLE "marketing"."cms_media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileHash" TEXT,
    "altText" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cms_media_url_key" ON "marketing"."cms_media"("url");

-- CreateIndex
CREATE INDEX "cms_media_createdAt_idx" ON "marketing"."cms_media"("createdAt");

-- CreateIndex
CREATE INDEX "cms_media_deletedAt_idx" ON "marketing"."cms_media"("deletedAt");

-- CreateIndex
CREATE INDEX "cms_media_fileHash_idx" ON "marketing"."cms_media"("fileHash");
