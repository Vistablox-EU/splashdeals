"use server";

import { prisma } from "@/app/(server)/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/app/(server)/lib/auth-guards";
import { handleServerActionError, type ActionResult } from "@/app/(server)/lib/server-action-error";
import { revalidatePath } from "next/cache";

// ─── List ────────────────────────────────────────────

export type RedirectRow = {
  id: string;
  source: string;
  destination: string;
  statusCode: number;
  isActive: boolean;
  createdAt: Date;
};

export async function listRedirectsAction(): Promise<ActionResult<RedirectRow[]>> {
  try {
    await requireAdmin();
    const redirects = await prisma.redirect.findMany({ orderBy: { createdAt: "desc" } });
    return { success: true, data: redirects as unknown as RedirectRow[] };
  } catch (error) {
    return handleServerActionError(error, "redirects/list");
  }
}

// ─── Create ──────────────────────────────────────────

const createSchema = {
  source: (v: string) => (v.trim().startsWith("/") ? v.trim() : `/${v.trim()}`),
  destination: (v: string) => v.trim(),
  statusCode: (v: number) => (v === 301 || v === 302 ? v : 301),
};

export async function createRedirectAction(data: {
  source: string;
  destination: string;
  statusCode?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSuperAdmin();

    // Basic validation
    if (!data.source || !data.destination) {
      return { success: false, error: "Source and destination are required." };
    }

    const source = createSchema.source(data.source as string);
    const destination = createSchema.destination(data.destination as string);
    const statusCode = createSchema.statusCode(data.statusCode || 301);

    const redirect = await prisma.redirect.create({
      data: { source, destination, statusCode },
    });

    revalidatePath("/admin/cms/redirects");
    return { success: true, data: { id: redirect.id } };
  } catch (error) {
    return handleServerActionError(error, "redirects/create");
  }
}

// ─── Update ──────────────────────────────────────────

export async function updateRedirectAction(
  id: string,
  data: {
    source?: string;
    destination?: string;
    statusCode?: number;
    isActive?: boolean;
  },
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    const updateData: Record<string, unknown> = {};
    if (data.source !== undefined) {
      updateData.source = createSchema.source(data.source as string);
    }
    if (data.destination !== undefined) {
      updateData.destination = createSchema.destination(data.destination as string);
    }
    if (data.statusCode !== undefined) {
      updateData.statusCode = createSchema.statusCode(data.statusCode);
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    await prisma.redirect.update({ where: { id }, data: updateData as any });

    revalidatePath("/admin/cms/redirects");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "redirects/update");
  }
}

// ─── Delete ──────────────────────────────────────────

export async function deleteRedirectAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    await prisma.redirect.delete({ where: { id } });
    revalidatePath("/admin/cms/redirects");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "redirects/delete");
  }
}

// ─── Toggle Active ───────────────────────────────────

export async function toggleRedirectAction(id: string): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    const existing = await prisma.redirect.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Redirect not found." };
    }

    await prisma.redirect.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    revalidatePath("/admin/cms/redirects");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "redirects/toggle");
  }
}
