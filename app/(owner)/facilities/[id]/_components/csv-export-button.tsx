"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface SaleRow {
  id: string;
  totalAmount: { toString(): string };
  createdAt: Date;
  issuedTickets: { id: string }[];
}

interface Props {
  sales: SaleRow[];
  facilityName: string;
  dict: Record<string, unknown>;
}

export function CsvExportButton({ sales, facilityName, dict }: Props) {
  const t = dict.owner as Record<string, string>;

  const handleExport = () => {
    const headers = [t.csv_id, t.csv_date, t.csv_amount, t.csv_tickets];
    const rows = sales.map((tx) => [
      tx.id,
      new Date(tx.createdAt).toISOString().slice(0, 10),
      Number(tx.totalAmount).toFixed(2),
      tx.issuedTickets.length.toString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t.csv_filename_prefix}${facilityName.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      {t.export_csv}
    </Button>
  );
}
