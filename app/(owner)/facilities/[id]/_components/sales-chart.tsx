"use client";

interface DailyData {
  date: string;
  sales: number;
  revenue: number;
}

interface Props {
  data: DailyData[];
}

export function SalesChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nema podataka za prikaz.
      </p>
    );
  }

  const maxSales = Math.max(...data.map((d) => d.sales), 1);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  // Show every ~7th label to avoid crowding
  const labelInterval = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className="space-y-6">
      {/* Sales bar chart */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Prodaja po danu (30 dana)
        </h3>
        <div className="flex items-end gap-[2px] h-40">
          {data.map((d) => {
            const heightPct = (d.sales / maxSales) * 100;
            return (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <div
                  className="w-full bg-primary/80 hover:bg-primary rounded-t transition-colors"
                  style={{ height: `${Math.max(heightPct, 1)}%` }}
                  title={`${d.date}: ${d.sales} prodaja (${d.revenue.toLocaleString("sr-RS")} RSD)`}
                />
              </div>
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="flex mt-1">
          {data.map((d, i) => (
            <div
              key={d.date}
              className="flex-1 text-center"
              style={
                i % labelInterval === 0
                  ? {}
                  : { visibility: "hidden" }
              }
            >
              <span className="text-[10px] text-muted-foreground">
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
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Prihod po danu (30 dana)
        </h3>
        <div className="flex items-end gap-[2px] h-40">
          {data.map((d) => {
            const heightPct = (d.revenue / maxRevenue) * 100;
            return (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <div
                  className="w-full bg-emerald-500/70 hover:bg-emerald-500 rounded-t transition-colors"
                  style={{ height: `${Math.max(heightPct, 1)}%` }}
                  title={`${d.date}: ${d.revenue.toLocaleString("sr-RS")} RSD`}
                />
              </div>
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="flex mt-1">
          {data.map((d, i) => (
            <div
              key={d.date}
              className="flex-1 text-center"
              style={
                i % labelInterval === 0
                  ? {}
                  : { visibility: "hidden" }
              }
            >
              <span className="text-[10px] text-muted-foreground">
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
