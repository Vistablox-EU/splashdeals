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
}

export function AnalyticsOverview({
  totalViews,
  views7d,
  totalSales,
  sales7d,
  totalRevenue,
  revenue7d,
  conversionRate,
}: Props) {
  const cards = [
    {
      title: "Pregleda (7 dana)",
      value: views7d.toLocaleString("sr-RS"),
      subtitle: `${totalViews.toLocaleString("sr-RS")} ukupno`,
    },
    {
      title: "Prodaja (7 dana)",
      value: sales7d.toLocaleString("sr-RS"),
      subtitle: `${totalSales.toLocaleString("sr-RS")} ukupno`,
    },
    {
      title: "Prihod (7 dana)",
      value: formatCurrency(revenue7d),
      subtitle: `${formatCurrency(totalRevenue)} ukupno`,
    },
    {
      title: "Stopa konverzije",
      value: `${(conversionRate * 100).toFixed(2)}%`,
      subtitle: "prodaja / pregledi",
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
