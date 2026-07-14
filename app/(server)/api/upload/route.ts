import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { prisma } from "@/app/(server)/lib/prisma";
import { MediaType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { MAX_FILE_SIZE } from "@/lib/constants";

/**
 * 🌊 High-Bandwidth Media Gateway (Agent Protocol)
 * Handles direct-to-storage client uploads for 4K videos and high-res assets.
 * Bypasses standard Next.js body size limits (1MB/10MB).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        const facilityId = payload.facilityId;
        const uploadType = payload.uploadType || "MEDIA";

        if (!facilityId) {
          throw new Error("Facility ID is required for upload authorization");
        }

        // Verify admin session
        await requireAdmin();

        // Rate limiting: max 50 uploads per facility per hour
        const oneHourAgo = new Date(Date.now() - 3600000);
        const recentUploads = await prisma.facilityMedia.count({
          where: {
            facilityId,
            createdAt: { gte: oneHourAgo },
          },
        });
        if (recentUploads >= 50) {
          throw new Error("Upload limit reached for this facility (max 50/hour)");
        }

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/svg+xml",
            "video/mp4",
            "video/quicktime",
            "video/webm",
          ],
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: uploadType !== "LOGO",
          allowOverwrite: true,
          tokenPayload: JSON.stringify({
            facilityId,
            uploadType,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const { facilityId, uploadType } = JSON.parse(tokenPayload!);

          if (uploadType === "TICKET" || uploadType === "LOGO") {
            return;
          }

          const isVideo = blob.contentType.startsWith("video/");
          const mediaType = isVideo ? MediaType.VIDEO : MediaType.PHOTO;

          const lastMedia = await prisma.facilityMedia.findFirst({
            where: { facilityId },
            orderBy: { order: "desc" },
          });
          const nextOrder = (lastMedia?.order ?? -1) + 1;

          await prisma.facilityMedia.create({
            data: {
              facilityId,
              url: blob.url,
              type: mediaType,
              order: nextOrder,
            },
          });

          revalidatePath(`/admin/facilities/${facilityId}/media`);
        } catch (error) {
          console.error("Failed to sync media to database:", error);
          throw new Error("Database sync failed");
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
