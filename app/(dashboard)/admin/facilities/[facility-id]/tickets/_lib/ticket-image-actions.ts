"use server";

import { processImageToWebP } from "@/app/(server)/lib/media";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { prisma } from "@/app/(server)/lib/prisma";
import { validateFacilityAccess } from "@/app/(server)/lib/auth-guards";
import { revalidatePath } from "next/cache";

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

async function assertProductAccess(productId: string) {
  const product = await prisma.ticketProduct.findUnique({
    where: { id: productId },
    select: {
      id: true,
      imageUrl: true,
      category: { select: { facilityId: true } },
    },
  });
  if (!product) throw new Error("Tip ulaznice nije pronađen");
  await validateFacilityAccess(product.category.facilityId);
  return product;
}

function revalidateTickets(facilityId: string) {
  revalidatePath(`/admin/facilities/${facilityId}/tickets`);
}

export async function uploadProductImage(productId: string, formData: FormData) {
  try {
    const product = await assertProductAccess(productId);
    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "Fajl nije priložen" };

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "Fajl je prevelik. Maksimalna veličina je 25MB." };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Nepodržan format fajla. Prihvatamo sve slikovne formate.",
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await processImageToWebP(buffer);

    const { put } = await import("@vercel/blob");
    const fileName = `tickets/products/${productId}/${Date.now()}.webp`;
    const blob = await put(fileName, webpBuffer, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
    });

    if (product.imageUrl) {
      const { del } = await import("@vercel/blob");
      await del(product.imageUrl).catch(() => {});
    }

    await prisma.ticketProduct.update({
      where: { id: productId },
      data: { imageUrl: blob.url },
    });

    revalidateTickets(product.category.facilityId);
    return { success: true, url: blob.url };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Otpremanje nije uspelo",
    };
  }
}

export async function deleteProductImage(productId: string, imageUrl: string) {
  try {
    const product = await assertProductAccess(productId);
    const { del } = await import("@vercel/blob");
    await del(imageUrl).catch(() => {});
    await prisma.ticketProduct.update({
      where: { id: productId },
      data: { imageUrl: null },
    });
    revalidateTickets(product.category.facilityId);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Brisanje slike nije uspelo",
    };
  }
}

export async function renameProductImage(productId: string, oldUrl: string, newName: string) {
  try {
    const product = await assertProductAccess(productId);
    const response = await fetch(oldUrl);
    if (!response.ok) return { success: false, error: "Učitavanje postojeće slike nije uspelo" };
    const buffer = Buffer.from(await response.arrayBuffer());

    const { put, del } = await import("@vercel/blob");
    const newFileName = `tickets/products/${productId}/${newName.replace(/[^a-zA-Z0-9_-]/g, "_")}.webp`;
    const newBlob = await put(newFileName, buffer, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
    });

    await del(oldUrl).catch(() => {});

    await prisma.ticketProduct.update({
      where: { id: productId },
      data: { imageUrl: newBlob.url },
    });

    revalidateTickets(product.category.facilityId);
    return { success: true, url: newBlob.url };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Preimenovanje nije uspelo",
    };
  }
}
