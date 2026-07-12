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
}

export function CsvExportButton({ sales, facilityName }: Props) {
  const handleExport = () => {
    const headers = ["ID transakcije", "Datum", "Iznos (RSD)", "Broj karata"];
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
    a.download = `transakcije-${facilityName.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      Izvezi CSV
    </Button>
  );
}
