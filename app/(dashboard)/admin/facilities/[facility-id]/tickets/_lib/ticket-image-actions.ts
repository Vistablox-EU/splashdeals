"use server"

import { revalidatePath } from "next/cache"

export async function uploadTicketImageAction(formData: FormData) {
  const facilityId = formData.get("facilityId") as string;
  const file = formData.get("file") as File;
  if (!file || !facilityId) return { success: false, error: "Missing file or facilityId" };

  try {
    const { put } = await import("@vercel/blob");
    const blob = await put(`tickets/${facilityId}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { success: true, url: blob.url };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export async function renameTicketImageAction(facilityId: string, oldUrl: string, newName: string) {
  try {
    const { put, del } = await import("@vercel/blob");
    const response = await fetch(oldUrl);
    const blob = await response.blob();
    const file = new File([blob], `${newName}.webp`, { type: "image/webp" });
    const newBlob = await put(`tickets/${facilityId}/${newName}.webp`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    await del(oldUrl).catch(() => {});
    return { success: true, url: newBlob.url };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Rename failed" };
  }
}
