import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/server/lib/prisma';
import { MediaType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

/**
 * 🌊 High-Bandwidth Media Gateway (Agent Protocol)
 * Handles direct-to-storage client uploads for 4K videos and high-res assets.
 * Bypasses standard Next.js body size limits (1MB/10MB).
 * 
 * This route is housed in app/api according to project routing protocols.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        /**
         * Auth Check: Only authorized users should be able to upload.
         * In a production environment, check the session here.
         * We extract facilityId from clientPayload.
         */
        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        const facilityId = payload.facilityId;
        const uploadType = payload.uploadType || 'MEDIA';

        if (!facilityId) {
          throw new Error('Facility ID is required for upload authorization');
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/quicktime', 'video/webm'],
          addRandomSuffix: uploadType !== 'LOGO',
          allowOverwrite: true,
          tokenPayload: JSON.stringify({
            facilityId,
            uploadType,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        /**
         * 🏁 Finalization Logic
         * Triggered once the file is successfully streamed from browser to storage.
         * We sync the resulting URL to the Prisma database.
         */
        try {
          const { facilityId, uploadType } = JSON.parse(tokenPayload!);

          if (uploadType === 'TICKET' || uploadType === 'LOGO') {
            // For tickets and logos, we do not insert into FacilityMedia table
            return;
          }

          // Determine media type
          const isVideo = blob.contentType.startsWith('video/');
          const mediaType = isVideo ? MediaType.VIDEO : MediaType.PHOTO;

          // Get the current max order
          const lastMedia = await prisma.facilityMedia.findFirst({
            where: { facilityId },
            orderBy: { order: 'desc' },
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

          // Revalidate the media gallery path for full cache freshness
          revalidatePath(`/admin/facilities/${facilityId}/media`);
        } catch (error) {
          console.error('Failed to sync media to database:', error);
          throw new Error('Database sync failed');
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
