"use client";

import { formatCurrency } from "@/lib/utils";

interface TicketType {
  title: string;
  count: number;
  revenue: number;
}

interface Props {
  data: TicketType[];
  dict: Record<string, unknown>;
}

export function TopTicketsTable({ data, dict }: Props) {
  const t = dict.owner as Record<string, string>;

  if (data.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-sm">{t.no_sales_data}</p>;
  }

  const totalCount = data.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 font-medium">{t.type_ticket}</th>
            <th className="pb-2 text-right font-medium">{t.sold_col}</th>
            <th className="pb-2 text-right font-medium">%</th>
            <th className="pb-2 text-right font-medium">{t.revenue_col}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((ticket) => (
            <tr key={ticket.title} className="border-b last:border-0">
              <td className="py-2 font-medium">{ticket.title}</td>
              <td className="text-muted-foreground py-2 text-right">
                {ticket.count.toLocaleString("sr-RS")}
              </td>
              <td className="text-muted-foreground py-2 text-right">
                {totalCount > 0 ? ((ticket.count / totalCount) * 100).toFixed(1) : "0.0"}%
              </td>
              <td className="py-2 text-right font-medium">{formatCurrency(ticket.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
