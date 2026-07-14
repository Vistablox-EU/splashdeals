"use server";

import { processImageToWebP } from "@/app/(server)/lib/media";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { prisma } from "@/app/(server)/lib/prisma";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/tiff",
  "image/bmp",
  "image/svg+xml",
  "image/heic",
  "image/heif",
];

export async function uploadProductImage(productId: string, formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "Missing file" };

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "Fajl je prevelik. Maksimalna veličina je 25MB." };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Nepodržan format fajla. Prihvatamo sve slikovne formate." };
  }

  try {
    // Convert to WebP via shared utility
    const buffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await processImageToWebP(buffer);

    const { put } = await import("@vercel/blob");
    const fileName = `tickets/products/${productId}/${Date.now()}.webp`;
    const blob = await put(fileName, webpBuffer, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
    });

    // Delete old image if exists
    const product = await prisma.ticketProduct.findUnique({
      where: { id: productId },
      select: { imageUrl: true },
    });
    if (product?.imageUrl) {
      const { del } = await import("@vercel/blob");
      await del(product.imageUrl).catch(() => {});
    }

    // Update product with new imageUrl
    await prisma.ticketProduct.update({
      where: { id: productId },
      data: { imageUrl: blob.url },
    });

    return { success: true, url: blob.url };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export async function deleteProductImage(productId: string, imageUrl: string) {
  try {
    const { del } = await import("@vercel/blob");
    await del(imageUrl).catch(() => {});
    await prisma.ticketProduct.update({
      where: { id: productId },
      data: { imageUrl: null },
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Delete failed" };
  }
}

export async function renameProductImage(productId: string, oldUrl: string, newName: string) {
  try {
    // Fetch the existing WebP
    const response = await fetch(oldUrl);
    if (!response.ok) return { success: false, error: "Failed to fetch existing image" };
    const buffer = Buffer.from(await response.arrayBuffer());

    // Upload with new name (no suffix)
    const { put, del } = await import("@vercel/blob");
    const newFileName = `tickets/products/${productId}/${newName.replace(/[^a-zA-Z0-9_-]/g, "_")}.webp`;
    const newBlob = await put(newFileName, buffer, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
    });

    // Delete old
    await del(oldUrl).catch(() => {});

    // Update product
    await prisma.ticketProduct.update({
      where: { id: productId },
      data: { imageUrl: newBlob.url },
    });

    return { success: true, url: newBlob.url };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Rename failed" };
  }
}
