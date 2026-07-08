"use server"

import { put } from "@vercel/blob"
import { validateAction } from "@/server/lib/actions/validator"
import { z } from "zod"

const uploadImageSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
})

/**
 * Uploads an image to Vercel Blob and returns the public URL.
 * Used by CMS components instead of calling /api/upload directly.
 */
export async function uploadImageAction(formData: FormData) {
  try {
    const file = formData.get("file") as File | null
    if (!file) throw new Error("No file provided")

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `cms/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type || "image/webp",
    })

    return { success: true, url: blob.url }
  } catch (error) {
    console.error("[uploadImageAction]", error)
    return { success: false, error: "Upload failed" }
  }
}
