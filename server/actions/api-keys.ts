"use server"

import { prisma } from "@/server/lib/prisma"
import { requireSuperAdmin } from "@/server/lib/auth-guards"
import { generateApiKey } from "@/server/lib/api-key-auth"
import { handleServerActionError } from "@/server/lib/server-action-error"
import { revalidatePath } from "next/cache"

export async function createApiKeyAction(name: string) {
  try {
    const user = await requireSuperAdmin()

    const { plainKey, prefix, hashedKey } = generateApiKey()

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        prefix,
        key: hashedKey,
        userId: user.id,
      },
    })

    revalidatePath("/admin/api-keys")

    return { success: true, data: { ...apiKey, key: plainKey } }
  } catch (error) {
    const result = handleServerActionError(error)
    return { success: false, error: result.error || "Failed to create API key" }
  }
}

export async function deleteApiKeyAction(id: string) {
  try {
    await requireSuperAdmin()

    await prisma.apiKey.delete({
      where: { id },
    })

    revalidatePath("/admin/api-keys")

    return { success: true }
  } catch (error) {
    const result = handleServerActionError(error)
    return { success: false, error: result.error || "Failed to delete API key" }
  }
}
