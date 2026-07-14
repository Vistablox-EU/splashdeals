"use server";

import { prisma } from "@/app/(server)/lib/prisma";
import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { handleServerActionError, type ActionResult } from "@/app/(server)/lib/server-action-error";
import { revalidatePath } from "next/cache";

// ─── Event types ───────────────────────────────────────

export const WEBHOOK_EVENTS = [
  "post.created",
  "post.updated",
  "post.deleted",
  "page.created",
  "page.updated",
  "page.deleted",
  "category.created",
  "category.updated",
  "category.deleted",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

// ─── Types ─────────────────────────────────────────────

export interface WebhookWithLatestLog {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  consecutiveFailures: number;
  createdAt: string;
  updatedAt: string;
  latestLog: {
    id: string;
    event: string;
    status: string;
    responseCode: number | null;
    createdAt: string;
  } | null;
}

// ─── Read ──────────────────────────────────────────────

export async function listWebhooksAction(): Promise<ActionResult<WebhookWithLatestLog[]>> {
  try {
    await requireAdmin();

    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        logs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const serialized: WebhookWithLatestLog[] = webhooks.map((w) => ({
      id: w.id,
      name: w.name,
      url: w.url,
      events: w.events,
      isActive: w.isActive,
      consecutiveFailures: w.consecutiveFailures,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
      latestLog: w.logs[0]
        ? {
            id: w.logs[0].id,
            event: w.logs[0].event,
            status: w.logs[0].status,
            responseCode: w.logs[0].responseCode,
            createdAt: w.logs[0].createdAt.toISOString(),
          }
        : null,
    }));

    return { success: true, data: serialized };
  } catch (error) {
    return handleServerActionError(error, "webhooks/listWebhooks");
  }
}

export async function getWebhookAction(
  id: string,
): Promise<
  ActionResult<{ webhook: Record<string, unknown>; logs: Array<Record<string, unknown>> }>
> {
  try {
    await requireAdmin();

    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) {
      return { success: false, error: "Vebhuk nije pronađen." };
    }

    const logs = await prisma.webhookLog.findMany({
      where: { webhookId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return {
      success: true,
      data: {
        webhook: webhook as unknown as Record<string, unknown>,
        logs: logs as unknown as Array<Record<string, unknown>>,
      },
    };
  } catch (error) {
    return handleServerActionError(error, "webhooks/getWebhook");
  }
}

// ─── Create ────────────────────────────────────────────

export async function createWebhookAction(data: {
  name: string;
  url: string;
  events: string[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    if (!data.name.trim()) {
      return { success: false, error: "Naziv je obavezan." };
    }
    if (!data.url.trim()) {
      return { success: false, error: "URL je obavezan." };
    }
    if (!data.events.length) {
      return { success: false, error: "Izaberite barem jedan događaj." };
    }

    const webhook = await prisma.webhook.create({
      data: {
        name: data.name.trim(),
        url: data.url.trim(),
        events: data.events,
      },
    });

    revalidatePath("/admin/cms/webhooks");
    return { success: true, data: { id: webhook.id } };
  } catch (error) {
    return handleServerActionError(error, "webhooks/createWebhook");
  }
}

// ─── Update ────────────────────────────────────────────

export async function updateWebhookAction(
  id: string,
  data: { name: string; url: string; events: string[] },
): Promise<ActionResult> {
  try {
    await requireAdmin();

    if (!data.name.trim()) {
      return { success: false, error: "Naziv je obavezan." };
    }
    if (!data.url.trim()) {
      return { success: false, error: "URL je obavezan." };
    }
    if (!data.events.length) {
      return { success: false, error: "Izaberite barem jedan događaj." };
    }

    await prisma.webhook.update({
      where: { id },
      data: {
        name: data.name.trim(),
        url: data.url.trim(),
        events: data.events,
      },
    });

    revalidatePath("/admin/cms/webhooks");
    revalidatePath(`/admin/cms/webhooks/${id}`);
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "webhooks/updateWebhook");
  }
}

// ─── Delete ────────────────────────────────────────────

export async function deleteWebhookAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.webhook.delete({ where: { id } });
    revalidatePath("/admin/cms/webhooks");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "webhooks/deleteWebhook");
  }
}

// ─── Test ──────────────────────────────────────────────

export async function testWebhookAction(
  id: string,
): Promise<ActionResult<{ statusCode: number | null }>> {
  try {
    await requireAdmin();

    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) {
      return { success: false, error: "Vebhuk nije pronađen." };
    }

    // Send a test POST request to the webhook URL
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "test",
        data: { message: "Ovo je testni zahtev sa Splashdeals CMS sistema." },
        timestamp: new Date().toISOString(),
      }),
    });

    // Log the test result
    await prisma.webhookLog.create({
      data: {
        webhookId: id,
        event: "test",
        status: response.ok ? "success" : "failed",
        responseCode: response.status,
        responseBody: await response.text().catch(() => null),
      },
    });

    return { success: true, data: { statusCode: response.status } };
  } catch (error) {
    // Log network errors too
    try {
      await prisma.webhookLog.create({
        data: {
          webhookId: id,
          event: "test",
          status: "failed",
          responseCode: null,
          responseBody: error instanceof Error ? error.message : "Network error",
        },
      });
    } catch {
      // ignore logging errors
    }

    return handleServerActionError(error, "webhooks/testWebhook");
  }
}

// ─── Reactivate ────────────────────────────────────────

export async function reactivateWebhookAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    await prisma.webhook.update({
      where: { id },
      data: {
        isActive: true,
        consecutiveFailures: 0,
      },
    });

    revalidatePath("/admin/cms/webhooks");
    return { success: true };
  } catch (error) {
    return handleServerActionError(error, "webhooks/reactivateWebhook");
  }
}

// ─── List logs for a webhook ──────────────────────────

export async function listWebhookLogsAction(
  webhookId: string,
  limit = 50,
): Promise<ActionResult<Array<Record<string, unknown>>>> {
  try {
    await requireAdmin();

    const logs = await prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return { success: true, data: logs as unknown as Array<Record<string, unknown>> };
  } catch (error) {
    return handleServerActionError(error, "webhooks/listWebhookLogs");
  }
}

// ─── Internal helpers ──────────────────────────────────

async function incrementFailures(id: string): Promise<void> {
  const wh = await prisma.webhook.update({
    where: { id },
    data: { consecutiveFailures: { increment: 1 } },
  });
  if (wh.consecutiveFailures >= 10) {
    await prisma.webhook.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

/**
 * Trigger all active webhooks subscribed to the given event.
 * Called internally by CMS actions — not a server action.
 */
export async function triggerWebhooks(
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const webhooks = await prisma.webhook.findMany({
    where: { isActive: true, events: { has: event } },
  });

  if (webhooks.length === 0) return;

  await Promise.allSettled(
    webhooks.map(async (wh) => {
      try {
        const res = await fetch(wh.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, payload }),
          signal: AbortSignal.timeout(5000),
        });

        await prisma.webhookLog.create({
          data: {
            webhookId: wh.id,
            event,
            status: res.ok ? "success" : "failed",
            responseCode: res.status,
          },
        });

        if (res.ok) {
          await prisma.webhook.update({
            where: { id: wh.id },
            data: { consecutiveFailures: 0 },
          });
        } else {
          await incrementFailures(wh.id);
        }
      } catch {
        await prisma.webhookLog.create({
          data: {
            webhookId: wh.id,
            event,
            status: "failed",
            responseCode: null,
          },
        });
        await incrementFailures(wh.id);
      }
    }),
  );
}
