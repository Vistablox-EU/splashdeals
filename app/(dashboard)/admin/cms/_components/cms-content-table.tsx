"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
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
  type Table as TanstackTable,
} from "@tanstack/react-table";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type CmsFilterLink = {
  hrefOn: string;
  hrefOff: string;
  active: boolean;
  label: string;
  icon: string;
};

export type CmsContentTableProps<TData extends { id: string }> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  /** Column id used for search filter (default: title) */
  searchColumnId?: string;
  searchPlaceholder: string;
  /** When set, renders a status Select against this column id */
  statusColumnId?: string;
  filterLinks?: CmsFilterLink[];
  selectedIds: Set<string>;
  bulkLabel: string;
  bulkActions?: ReactNode;
  emptyIcon?: string;
  emptyLabel: string;
  emptyCtaLabel: string;
  emptyCtaHref: string;
  countLabel: (n: number) => string;
  initialSorting?: SortingState;
  /** Optional extra toolbar content after search/status/filters */
  toolbarExtra?: ReactNode;
};

export function CmsContentTable<TData extends { id: string }>({
  data,
  columns,
  searchColumnId = "title",
  searchPlaceholder,
  statusColumnId,
  filterLinks = [],
  selectedIds,
  bulkLabel,
  bulkActions,
  emptyIcon = "article",
  emptyLabel,
  emptyCtaLabel,
  emptyCtaHref,
  countLabel,
  initialSorting = [{ id: "createdAt", desc: true }],
  toolbarExtra,
}: CmsContentTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
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
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm min-w-[12rem] flex-1">
          <Icon
            name="search"
            className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          />
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchColumnId)?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn(searchColumnId)?.setFilterValue(e.target.value)}
            className="h-9 pl-8"
          />
        </div>

        {statusColumnId && (
          <Select
            value={(table.getColumn(statusColumnId)?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) => {
              if (value === "all") {
                table.getColumn(statusColumnId)?.setFilterValue(undefined);
              } else {
                table.getColumn(statusColumnId)?.setFilterValue(value);
              }
            }}
          >
            <SelectTrigger aria-label="Filtriraj po statusu" className="w-[160px]">
              <SelectValue placeholder="Svi statusi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi statusi</SelectItem>
              <SelectItem value="DRAFT">Nacrt</SelectItem>
              <SelectItem value="REVIEW">Na pregledu</SelectItem>
              <SelectItem value="PUBLISHED">Objavljeno</SelectItem>
              <SelectItem value="ARCHIVED">Arhivirano</SelectItem>
            </SelectContent>
          </Select>
        )}

        {filterLinks.map((f) => (
          <Button key={f.label} variant={f.active ? "default" : "outline"} size="sm" asChild>
            <Link href={f.active ? f.hrefOff : f.hrefOn}>
              <Icon name={f.icon} className="size-3.5" />
              {f.label}
            </Link>
          </Button>
        ))}

        {toolbarExtra}
      </div>

      {selectedIds.size > 0 && bulkActions && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">
            Izabrano: {selectedIds.size} {bulkLabel}
          </span>
          {bulkActions}
        </div>
      )}

      <CmsTableBody
        table={table}
        columnCount={columns.length}
        emptyIcon={emptyIcon}
        emptyLabel={emptyLabel}
        emptyCtaLabel={emptyCtaLabel}
        emptyCtaHref={emptyCtaHref}
      />

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          {countLabel(table.getFilteredRowModel().rows.length)}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Prethodna strana"
          >
            <Icon name="chevron_left" className="size-4" />
          </Button>
          <span className="text-muted-foreground text-xs">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Sledeća strana"
          >
            <Icon name="chevron_right" className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CmsTableBody<TData>({
  table,
  columnCount,
  emptyIcon,
  emptyLabel,
  emptyCtaLabel,
  emptyCtaHref,
}: {
  table: TanstackTable<TData>;
  columnCount: number;
  emptyIcon: string;
  emptyLabel: string;
  emptyCtaLabel: string;
  emptyCtaHref: string;
}) {
  return (
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
              <TableCell colSpan={columnCount} className="h-32 text-center">
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Icon name={emptyIcon} className="size-8" />
                  <p className="text-sm">{emptyLabel}</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={emptyCtaHref}>
                      <Icon name="add" className="mr-1 size-4" />
                      {emptyCtaLabel}
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
