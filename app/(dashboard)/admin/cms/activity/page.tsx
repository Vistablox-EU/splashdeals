import { requireAdmin } from "@/server/lib/auth-guards";
import { getActivityLogAction } from "@/app/(server)/actions/activity";
import { connection } from "next/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aktivnosti | CMS | Splashdeals",
};

export default async function ActivityLogPage() {
  await requireAdmin();
  await connection();

  const result = await getActivityLogAction(200);
  const logs = result.success && result.data ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aktivnosti</h1>
        <p className="text-muted-foreground mt-1 text-sm">Dnevnik svih CMS aktivnosti</p>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-3 text-left font-medium">Vreme</th>
                <th className="px-4 py-3 text-left font-medium">Akcija</th>
                <th className="px-4 py-3 text-left font-medium">Tip entiteta</th>
                <th className="px-4 py-3 text-left font-medium">ID entiteta</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                    Još uvek nema aktivnosti.
                  </td>
                </tr>
              ) : (
                logs.map((log: Record<string, unknown>) => (
                  <tr key={log.id as string} className="hover:bg-muted/30 border-b last:border-0">
                    <td className="text-muted-foreground px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {new Date(log.createdAt as string).toLocaleString("sr-RS")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                        {log.action as string}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">
                      {(log.entityType as string) || "—"}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                      {(log.entityId as string) || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Prikazano {logs.length} poslednjih aktivnosti. Aktivnosti se automatski evidentiraju.
      </p>
    </div>
  );
}
