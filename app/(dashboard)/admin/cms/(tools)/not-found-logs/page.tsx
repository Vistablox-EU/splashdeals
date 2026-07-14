import { requireAdmin } from "@/app/(server)/lib/auth-guards";
import { getNotFoundLogsAction } from "@/app/(server)/actions/cms/tools";
import { connection } from "next/server";
import type { Metadata } from "next";
import { NotFoundLogsClient } from "./_components/not-found-logs-client";

export const metadata: Metadata = {
  title: "404 greške | CMS | Splashdeals",
  description: "Pregled i upravljanje evidentiranim 404 greškama.",
};

export default async function NotFoundLogsPage() {
  await requireAdmin();
  await connection();

  const result = await getNotFoundLogsAction();

  const logs =
    result.success && result.data
      ? result.data.map((log) => ({
          id: log.id,
          path: log.path,
          referrer: log.referrer,
          count: log.count,
          firstSeen: log.firstSeen.toISOString(),
          lastSeen: log.lastSeen.toISOString(),
        }))
      : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">404 greške</h1>
          <p className="text-muted-foreground text-sm">
            Evidentirane 404 greške na sajtu sa brojem pojavljivanja.
          </p>
        </div>
      </div>

      <NotFoundLogsClient logs={logs} />
    </div>
  );
}
