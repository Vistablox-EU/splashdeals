import "server-only";
import sharp from "sharp";

/** Maximum upload file size (10MB) shared across server and client */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Converts an image buffer to WebP format (max 2000px wide).
 * Optimized for facility gallery images.
 */
export async function processImageToWebP(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(2000, undefined, { 
      withoutEnlargement: true,
      fit: 'inside'
    })
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Generates a 400x400 WebP thumbnail (cover crop).
 * For quick previews in admin dashboards.
 */
export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(400, 400, {
      fit: 'cover',
    })
    .webp({ quality: 70 })
    .toBuffer();
}

/**
 * Processes a ticket image to strict 1.91:1 aspect ratio (1200x630).
 * Required for Open Graph / social preview compatibility.
 */
export async function processTicketImage(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(1200, 630, {
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 85 })
    .toBuffer();
}
