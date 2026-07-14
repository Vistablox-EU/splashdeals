"use server";

import { prisma } from "@/app/(server)/lib/prisma";
import { requireSuperAdmin } from "@/app/(server)/lib/auth-guards";
import { generateApiKey } from "@/app/(server)/lib/api-key-auth";
import { handleServerActionError } from "@/app/(server)/lib/server-action-error";
import { revalidateAdminUsers } from "@/app/(server)/lib/revalidation";

export async function getApiKeysAction() {
  try {
    const user = await requireSuperAdmin();
    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        prefix: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    });
    return { success: true, data: keys };
  } catch (error) {
    return handleServerActionError(error, "api-keys");
  }
}

export async function createApiKeyAction(name: string) {
  try {
    const user = await requireSuperAdmin();
    const { plainKey, prefix, hashedKey } = generateApiKey();
    await prisma.apiKey.create({
      data: {
        name,
        key: hashedKey,
        prefix,
        userId: user.id,
      },
    });
    revalidateAdminUsers();
    return { success: true, data: { key: plainKey, prefix } };
  } catch (error) {
    return handleServerActionError(error, "api-keys");
  }
}

export async function deleteApiKeyAction(id: string) {
  try {
    await requireSuperAdmin();
    await prisma.apiKey.delete({ where: { id } });
    revalidateAdminUsers();
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "api-keys");
  }
}
