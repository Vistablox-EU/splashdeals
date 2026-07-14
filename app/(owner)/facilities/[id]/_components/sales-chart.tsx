"use client";

interface DailyData {
  date: string;
  sales: number;
  revenue: number;
}

interface Props {
  data: DailyData[];
  dict: Record<string, unknown>;
}

export function SalesChart({ data, dict }: Props) {
  const t = dict.owner as Record<string, string>;

  if (data.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">{t.no_chart_data}</p>;
  }

  const maxSales = Math.max(...data.map((d) => d.sales), 1);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  // Show every ~7th label to avoid crowding
  const labelInterval = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className="space-y-6">
      {/* Sales bar chart */}
      <div>
        <h3 className="text-muted-foreground mb-3 text-sm font-medium">{t.sales_per_day}</h3>
        <div className="flex h-40 items-end gap-[2px]">
          {data.map((d) => {
            const heightPct = (d.sales / maxSales) * 100;
            return (
              <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end">
                <div
                  className="bg-primary/80 hover:bg-primary w-full rounded-t transition-colors"
                  style={{ height: `${Math.max(heightPct, 1)}%` }}
                  title={`${d.date}: ${d.sales} prodaja (${d.revenue.toLocaleString("sr-RS")} RSD)`}
                />
              </div>
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="mt-1 flex">
          {data.map((d, i) => (
            <div
              key={d.date}
              className="flex-1 text-center"
              style={i % labelInterval === 0 ? {} : { visibility: "hidden" }}
            >
              <span className="text-muted-foreground text-[10px]">
                {new Date(d.date + "T00:00:00").toLocaleDateString("sr-RS", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue bar chart */}
      <div>
        <h3 className="text-muted-foreground mb-3 text-sm font-medium">{t.revenue_per_day}</h3>
        <div className="flex h-40 items-end gap-[2px]">
          {data.map((d) => {
            const heightPct = (d.revenue / maxRevenue) * 100;
            return (
              <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end">
                <div
                  className="w-full rounded-t bg-emerald-500/70 transition-colors hover:bg-emerald-500"
                  style={{ height: `${Math.max(heightPct, 1)}%` }}
                  title={`${d.date}: ${d.revenue.toLocaleString("sr-RS")} RSD`}
                />
              </div>
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="mt-1 flex">
          {data.map((d, i) => (
            <div
              key={d.date}
              className="flex-1 text-center"
              style={i % labelInterval === 0 ? {} : { visibility: "hidden" }}
            >
              <span className="text-muted-foreground text-[10px]">
                {new Date(d.date + "T00:00:00").toLocaleDateString("sr-RS", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
