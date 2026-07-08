"use server"

import { z } from "zod";
import { put, del } from "@vercel/blob";
import { prisma } from "@/server/lib/prisma";
import { processImageToWebP } from "@/server/lib/media";
import { MediaType, MediaPurpose } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { handleServerActionError } from "@/server/lib/server-action-error"
import { validateAction } from "@/server/lib/actions/validator"
import { validateFacilityAccess } from "@/server/lib/auth-guards"
import { renameMediaSchema } from "@/server/lib/validations/media"

const updateMediaPurposeSchema = z.object({
  mediaId: z.string().uuid(),
  purpose: z.nativeEnum(MediaPurpose),
})

const toggleMediaRoleSchema = z.object({
  mediaId: z.string().uuid(),
  facilityId: z.string().uuid(),
})

const deleteMediaSchema = z.object({
  mediaId: z.string().uuid(),
  facilityId: z.string().uuid(),
})

const updateMediaOrderSchema = z.object({
  facilityId: z.string().uuid(),
  mediaIds: z.array(z.string().uuid()),
})

const syncMediaSchema = z.object({
  facilityId: z.string().uuid(),
  blobUrl: z.string(),
  contentType: z.string(),
})

const updateMediaCaptionSchema = z.object({
  mediaId: z.string().uuid(),
  facilityId: z.string().uuid(),
  caption: z.string().max(255).nullable(),
})

const updateMediaFocalPointSchema = z.object({
  mediaId: z.string().uuid(),
  facilityId: z.string().uuid(),
  focalPoint: z.string().max(20).nullable(), // Format: "X,Y" e.g., "50,30"
})

const bulkUpdateMediaCaptionSchema = z.object({
  mediaIds: z.array(z.string().uuid()),
  facilityId: z.string().uuid(),
  caption: z.string().max(255).nullable(),
})

const purposeValues = new Set(Object.values(MediaPurpose));

/**
 * Handles multi-file uploads with automated WebP conversion for images.
 */
export async function uploadMediaAction(formData: FormData) {
  try {
    const facilityId = formData.get("facilityId");
    const rawFiles = formData.getAll("files");
    const rawPurpose = formData.get("purpose") as string | null;

    if (typeof facilityId !== "string" || rawFiles.length === 0) {
      throw new Error("Missing facility ID or files");
    }

    const files = rawFiles.filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      throw new Error("No valid files in upload");
    }

    let purpose: MediaPurpose = MediaPurpose.GALLERY;
    if (rawPurpose && purposeValues.has(rawPurpose as MediaPurpose)) {
      purpose = rawPurpose as MediaPurpose;
    }

    await validateFacilityAccess(facilityId)

    // Phase 1: Process all files outside transaction (no DB ops)
    const processedFiles: { facilityId: string; url: string; type: MediaType; purpose: MediaPurpose }[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      let finalUrl = "";
      const mediaType: MediaType = isVideo ? MediaType.VIDEO : MediaType.PHOTO;

      if (isImage) {
        const processedBuffer = await processImageToWebP(buffer);
        const filename = `facilities/${facilityId}/photos/${Date.now()}-${file.name.split('.')[0]}.webp`;
        
        const blob = await put(filename, processedBuffer, {
          access: "public",
          contentType: "image/webp",
        });
        finalUrl = blob.url;
      } else if (isVideo) {
        throw new Error("Videos must be uploaded via the high-bandwidth direct pipeline.");
      }

      if (finalUrl) {
        processedFiles.push({ facilityId, url: finalUrl, type: mediaType, purpose });
      }
    }

    // Phase 2: Atomically assign orders and create records (inside transaction)
    const results = await prisma.$transaction(async (tx) => {
      const lastMedia = await tx.facilityMedia.findFirst({
        where: { facilityId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      let order = (lastMedia?.order ?? -1) + 1;

      return Promise.all(
        processedFiles.map((data) =>
          tx.facilityMedia.create({ data: { ...data, order: order++ } })
        )
      );
    });

    revalidatePath(`/admin/facilities/${facilityId}/media`);
    revalidatePath(`/facilities/[categorySlug]/[facilitySlug]`, "layout");
    return { success: true, media: results };
  } catch (error) {
    return handleServerActionError(error, "media-actions")
  }
}

/**
 * ✏️ Renames a facility media file on blob storage.
 * Fetches the existing blob, re-uploads under the new name, deletes the old one.
 * Preserves the original file extension.
 */
export async function renameMediaAction(mediaId: string, facilityId: string, newName: string) {
  try {
    const validation = renameMediaSchema.parse({ mediaId, facilityId, newName })
    const { mediaId: mid, facilityId: fid, newName: name } = validation

    await validateFacilityAccess(fid)

    // Get the current media record
    const media = await prisma.facilityMedia.findUnique({ where: { id: mid } })
    if (!media) throw new Error("Medij nije pronađen")
    if (media.facilityId !== fid) throw new Error("Medij ne pripada ovom objektu")

    // Parse URL to extract extension
    const urlObj = new URL(media.url)
    const pathSegments = urlObj.pathname.split("/")
    const oldFilename = pathSegments[pathSegments.length - 1] ?? ""
    const extIndex = oldFilename.lastIndexOf(".")
    const extension = extIndex !== -1 ? oldFilename.slice(extIndex) : ""

    // Fetch existing blob
    const response = await fetch(media.url)
    if (!response.ok) throw new Error("Neuspešno preuzimanje postojećeg fajla sa storage-a")
    const buffer = Buffer.from(await response.arrayBuffer())

    // Upload with new name (keep directory and extension)
    const oldDir = pathSegments.slice(0, -1).join("/")
    const newPath = `${oldDir}/${Date.now()}-${name}${extension}`
    const blob = await put(newPath, buffer, {
      access: "public",
      contentType: response.headers.get("content-type") || "image/webp",
    })

    // Delete old blob
    await del(media.url).catch(() => {
      console.warn("Failed to delete old media blob:", media.url)
    })

    // Update database
    const updated = await prisma.facilityMedia.update({
      where: { id: mid },
      data: { url: blob.url },
    })

    revalidatePath(`/admin/facilities/${fid}/media`)
    return { success: true, media: updated }
  } catch (error) {
    return handleServerActionError(error, "media-actions")
  }
}

/**
 * Updates the purpose/gallery visibility of a media item.
 */
export async function updateMediaPurposeAction(mediaId: string, purpose: MediaPurpose) {
  try {
    const validation = await validateAction(updateMediaPurposeSchema, { mediaId, purpose });
    if (!validation.success) throw new Error(validation.error);

    const media = await prisma.facilityMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media) throw new Error("Media not found");

    await validateFacilityAccess(media.facilityId);

    let updated;
    if (purpose === MediaPurpose.AERIAL) {
      updated = await prisma.$transaction(async (tx) => {
        // Demote any existing AERIAL media to GALLERY for this facility
        await tx.facilityMedia.updateMany({
          where: {
            facilityId: media.facilityId,
            purpose: MediaPurpose.AERIAL,
          },
          data: { purpose: MediaPurpose.GALLERY },
        });

        // Set the new media purpose to AERIAL
        return await tx.facilityMedia.update({
          where: { id: mediaId },
          data: { purpose },
        });
      });
    } else {
      updated = await prisma.facilityMedia.update({
        where: { id: mediaId },
        data: { purpose },
      });
    }

    revalidatePath(`/admin/facilities/${media.facilityId}/media`);
    revalidatePath(`/facilities/[categorySlug]/[facilitySlug]`, "layout");

    return { success: true, media: updated };
  } catch (error) {
    return handleServerActionError(error, "media-actions")
  }
}

/**
 * Deletes media from both storage and database.
 */
export async function deleteMediaAction(mediaId: string, facilityId: string) {
  try {
    const validation = await validateAction(deleteMediaSchema, { mediaId, facilityId });
    if (!validation.success) throw new Error(validation.error);

    await validateFacilityAccess(facilityId)
    const media = await prisma.facilityMedia.findUnique({
      where: { id: mediaId },
    });

    if (!media) throw new Error("Media not found");

    await del(media.url);
    await prisma.facilityMedia.delete({
      where: { id: mediaId },
    });

    revalidatePath(`/admin/facilities/${facilityId}/media`);
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "media-actions")
  }
}

/**
 * Updates the sort order of the media gallery items.
 */
export async function updateMediaOrderAction(facilityId: string, mediaIds: string[]) {
  try {
    const validation = await validateAction(updateMediaOrderSchema, { facilityId, mediaIds });
    if (!validation.success) throw new Error(validation.error);

    await validateFacilityAccess(facilityId)
    await prisma.$transaction(
      validation.data.mediaIds.map((id: string, index: number) =>
        prisma.facilityMedia.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    revalidatePath(`/admin/facilities/${facilityId}/media`);
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "media-actions")
  }
}

/**
 * 🌊 High-Bandwidth Sync (LocalDev Bridge)
 */
export async function syncMediaAction(facilityId: string, blobUrl: string, contentType: string) {
  try {
    const validation = await validateAction(syncMediaSchema, { facilityId, blobUrl, contentType });
    if (!validation.success) throw new Error(validation.error);

    await validateFacilityAccess(facilityId)
    const isVideo = validation.data.contentType.startsWith("video/");
    const mediaType: MediaType = isVideo ? MediaType.VIDEO : MediaType.PHOTO;

    const existing = await prisma.facilityMedia.findFirst({
      where: { url: validation.data.blobUrl }
    });
    
    if (existing) return { success: true, media: existing };

    const lastMedia = await prisma.facilityMedia.findFirst({
      where: { facilityId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastMedia?.order ?? -1) + 1;

    const media = await prisma.facilityMedia.create({
      data: {
        facilityId,
        url: validation.data.blobUrl,
        type: mediaType,
        order: nextOrder,
      },
    });

    revalidatePath(`/admin/facilities/${facilityId}/media`);
    revalidatePath(`/facilities/[categorySlug]/[facilitySlug]`, "layout");

    return { success: true, media };
  } catch (error) {
    return handleServerActionError(error, "media-actions")
  }
}

/**
 * Toggles the Hero status of a media item, ensuring exclusivity.
 */
export async function toggleMediaHeroAction(mediaId: string, facilityId: string) {
  try {
    const validation = await validateAction(toggleMediaRoleSchema, { mediaId, facilityId });
    if (!validation.success) throw new Error(validation.error);

    await validateFacilityAccess(facilityId);

    const media = await prisma.facilityMedia.findUnique({ where: { id: mediaId } });
    if (!media) throw new Error("Media not found");

    const currentHero = media.isHero;

    const updated = await prisma.$transaction(async (tx) => {
      // If we are setting this as hero, unset any other hero
      if (!currentHero) {
        await tx.facilityMedia.updateMany({
          where: { facilityId, isHero: true },
          data: { isHero: false },
        });
      }

      return await tx.facilityMedia.update({
        where: { id: mediaId },
        data: { isHero: !currentHero },
      });
    });

    revalidatePath(`/admin/facilities/${facilityId}/media`);
    revalidatePath(`/facilities/[categorySlug]/[facilitySlug]`, "layout");
    return { success: true, media: updated };
  } catch (error) {
    return handleServerActionError(error, "media-actions")
  }
}

/**
 * Toggles the Card Background status of a media item, ensuring exclusivity.
 */
export async function toggleMediaCardBackgroundAction(mediaId: string, facilityId: string) {
  try {
    const validation = await validateAction(toggleMediaRoleSchema, { mediaId, facilityId });
    if (!validation.success) throw new Error(validation.error);

    await validateFacilityAccess(facilityId);

    const media = await prisma.facilityMedia.findUnique({ where: { id: mediaId } });
    if (!media) throw new Error("Media not found");

    const currentBG = media.isCardBackground;

    const updated = await prisma.$transaction(async (tx) => {
      // If we are setting this as background, unset any other
      if (!currentBG) {
        await tx.facilityMedia.updateMany({
          where: { facilityId, isCardBackground: true },
          data: { isCardBackground: false },
        });
      }

      return await tx.facilityMedia.update({
        where: { id: mediaId },
        data: { isCardBackground: !currentBG },
      });
    });

    revalidatePath(`/admin/facilities/${facilityId}/media`);
    revalidatePath(`/facilities/[categorySlug]/[facilitySlug]`, "layout");
    return { success: true, media: updated };
  } catch (error) {
    return handleServerActionError(error, "media-actions")
  }
}

/**
 * Toggles frontend gallery visibility.
 */
export async function toggleMediaGalleryVisibilityAction(mediaId: string, facilityId: string) {
  try {
    const validation = await validateAction(toggleMediaRoleSchema, { mediaId, facilityId });
    if (!validation.success) throw new Error(validation.error);

    await validateFacilityAccess(facilityId);

    const media = await prisma.facilityMedia.findUnique({ where: { id: mediaId } });
    if (!media) throw new Error("Media not found");

    const updated = await prisma.facilityMedia.update({
      where: { id: mediaId },
      data: { isGalleryVisible: !media.isGalleryVisible },
    });

    revalidatePath(`/admin/facilities/${facilityId}/media`);
    revalidatePath(`/facilities/[categorySlug]/[facilitySlug]`, "layout");
    return { success: true, media: updated };
  } catch (error) {
    return handleServerActionError(error, "media-actions")
  }
}

/**
 * Updates the caption/alt tag description of a media item.
 */
export async function updateMediaCaptionAction(mediaId: string, facilityId: string, caption: string | null) {
  try {
    const validation = await validateAction(updateMediaCaptionSchema, { mediaId, facilityId, caption });
    if (!validation.success) throw new Error(validation.error);

    await validateFacilityAccess(facilityId);

    const updated = await prisma.facilityMedia.update({
      where: { id: mediaId },
      data: { caption: validation.data.caption },
    });

    revalidatePath(`/admin/facilities/${facilityId}/media`);
    revalidatePath(`/facilities/[categorySlug]/[facilitySlug]`, "layout");

    return { success: true, media: updated };
  } catch (error) {
    return handleServerActionError(error, "media-actions")
  }
}

/**
 * Updates the focal point coordinates of a media item.
 */
export async function updateMediaFocalPointAction(mediaId: string, facilityId: string, focalPoint: string | null) {
  try {
    const validation = await validateAction(updateMediaFocalPointSchema, { mediaId, facilityId, focalPoint });
    if (!validation.success) throw new Error(validation.error);

    await validateFacilityAccess(facilityId);

    const updated = await prisma.facilityMedia.update({
      where: { id: mediaId },
      data: { focalPoint: validation.data.focalPoint },
    });

    revalidatePath(`/admin/facilities/${facilityId}/media`);
    revalidatePath(`/facilities/[categorySlug]/[facilitySlug]`, "layout");

    return { success: true, media: updated };
  } catch (error) {
    return handleServerActionError(error, "media-actions")
  }
}

/**
 * Bulk updates captions/alt tags for multiple media items.
 */
export async function bulkUpdateMediaCaptionAction(mediaIds: string[], facilityId: string, caption: string | null) {
  try {
    const validation = await validateAction(bulkUpdateMediaCaptionSchema, { mediaIds, facilityId, caption });
    if (!validation.success) throw new Error(validation.error);

    await validateFacilityAccess(facilityId);

    await prisma.facilityMedia.updateMany({
      where: {
        id: { in: validation.data.mediaIds },
        facilityId: validation.data.facilityId,
      },
      data: { caption: validation.data.caption },
    });

    revalidatePath(`/admin/facilities/${facilityId}/media`);
    revalidatePath(`/facilities/[categorySlug]/[facilitySlug]`, "layout");

    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "media-actions")
  }
}

