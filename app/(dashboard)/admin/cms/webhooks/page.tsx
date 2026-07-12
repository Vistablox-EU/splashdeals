import { requireAdmin } from "@/server/lib/auth-guards";
import { prisma } from "@/server/lib/prisma";
import { WebhooksListClient } from "./_components/webhooks-list-client";
import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Vebhukovi | CMS | Splashdeals",
};

export default async function WebhooksPage() {
  await requireAdmin();
  await connection();

  const webhooks = await prisma.webhook.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      logs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const serialized = webhooks.map((w) => ({
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

  return <WebhooksListClient webhooks={serialized as unknown as Array<Record<string, unknown>>} />;
}
