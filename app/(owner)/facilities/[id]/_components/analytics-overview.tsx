"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Props {
  totalViews: number;
  views7d: number;
  totalSales: number;
  sales7d: number;
  totalRevenue: number;
  revenue7d: number;
  conversionRate: number;
  dict: Record<string, unknown>;
}

export function AnalyticsOverview({
  totalViews,
  views7d,
  totalSales,
  sales7d,
  totalRevenue,
  revenue7d,
  conversionRate,
  dict,
}: Props) {
  const t = dict.owner as Record<string, string>;
  const cards = [
    {
      title: t.views_7d,
      value: views7d.toLocaleString("sr-RS"),
      subtitle: `${totalViews.toLocaleString("sr-RS")} ${t.total_suffix}`,
    },
    {
      title: t.sales_7d,
      value: sales7d.toLocaleString("sr-RS"),
      subtitle: `${totalSales.toLocaleString("sr-RS")} ${t.total_suffix}`,
    },
    {
      title: t.revenue_7d,
      value: formatCurrency(revenue7d),
      subtitle: `${formatCurrency(totalRevenue)} ${t.total_suffix}`,
    },
    {
      title: t.conversion_rate,
      value: `${(conversionRate * 100).toFixed(2)}%`,
      subtitle: t.conversion_subtitle,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-muted-foreground mt-1 text-xs">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
