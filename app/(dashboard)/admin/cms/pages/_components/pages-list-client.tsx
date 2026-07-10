"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deletePageAction } from "@/app/(server)/actions/cms";

const statusLabels: Record<string, string> = {
  DRAFT: "Nacrt",
  PUBLISHED: "Objavljeno",
  ARCHIVED: "Arhivirano",
};

interface PageRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  template: string;
  createdAt: string;
  publishedAt: string | null;
}

export function PagesListClient({ pages }: { pages: Array<Record<string, unknown>> }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const statusBadgeVariant = (status: string): "default" | "secondary" | "outline" => {
    switch (status) {
      case "PUBLISHED":
        return "default";
      case "DRAFT":
        return "secondary";
      case "ARCHIVED":
        return "outline";
      default:
        return "secondary";
    }
  };

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Da li ste sigurni da želite da obrišete ovu stranu?")) return;
      const result = await deletePageAction(id);
      if (result.success) {
        toast.success("Strana obrisana");
        router.refresh();
      } else {
        toast.error(result.error || "Greška prilikom brisanja");
      }
    },
    [router],
  );

  const columns: ColumnDef<PageRow>[] = [
    {
      accessorKey: "title",
      header: "Naslov",
      cell: ({ row }) => (
        <Button
          variant="link"
          className="h-auto p-0 text-left text-sm font-medium"
          onClick={() => router.push(`/admin/cms/pages/${row.original.id}`)}
        >
          {row.original.title}
        </Button>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <code className="text-muted-foreground text-xs">/{row.original.slug}</code>
      ),
    },
    {
      accessorKey: "template",
      header: "Šablon",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs capitalize">
          {row.original.template === "default" ? "Podrazumevani" : row.original.template}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusBadgeVariant(row.original.status)} className="text-xs">
          {statusLabels[row.original.status] || row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "publishedAt",
      header: "Objavljeno",
      cell: ({ row }) => {
        const date = row.original.publishedAt || row.original.createdAt;
        return <span className="text-muted-foreground text-xs">{formatDate(date)}</span>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label={`Izmeni stranu ${row.original.title}`}
            onClick={() => router.push(`/admin/cms/pages/${row.original.id}`)}
          >
            <Icon name="edit" className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive h-8 w-8 p-0"
            aria-label={`Obriši stranu ${row.original.title}`}
            onClick={() => handleDelete(row.original.id)}
          >
            <Icon name="delete" className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: pages as unknown as PageRow[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Icon
            name="search"
            className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          />
          <Input
            placeholder="Pretraži strane..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Icon name="file_text" className="size-8" />
                    <p className="text-sm">Nema strana</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/admin/cms/pages/new")}
                    >
                      <Icon name="add" className="mr-1 size-4" />
                      Kreiraj prvu stranu
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          {table.getFilteredRowModel().rows.length} strana
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Prethodna strana"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <Icon name="chevron_left" className="size-4" />
          </Button>
          <span className="text-muted-foreground text-xs">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            aria-label="Sledeća strana"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <Icon name="chevron_right" className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("sr-RS", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
