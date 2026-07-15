"use client";

import { Icon } from "@/components/ui/Icon";
import * as React from "react";
import {
  ColumnDef,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { bulkUpdateFacilityStatusAction } from "@/app/(server)/actions/facilities";
import { FacilityStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FacilitiesTableToolbar } from "./facilities-table-toolbar";
import { FacilitiesBulkBar } from "./facilities-bulk-bar";
import { FacilitiesTablePagination } from "./facilities-table-pagination";
import { createFacilityColumns } from "../columns";
import type { FacilityListSortKey } from "@/lib/admin/facilities-list-params";
import type { Facility } from "@prisma/client";

interface DataTableProps<TData extends { id: string }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  initialQ?: string;
  initialStatus?: string;
  initialSort?: FacilityListSortKey;
  initialOrder?: "asc" | "desc";
}

function readDensity(): "comfortable" | "compact" {
  if (typeof window === "undefined") return "compact";
  const saved = window.localStorage.getItem("table-density");
  return saved === "comfortable" || saved === "compact" ? saved : "compact";
}

export function DataTable<TData extends { id: string }, TValue>({
  columns: _columnsIgnored,
  data,
  totalCount,
  currentPage,
  pageSize,
  initialQ,
  initialStatus = "all",
  initialSort = "createdAt",
  initialOrder = "desc",
}: DataTableProps<TData, TValue>) {
  // Server sort drives headers; ignore static client-sort columns prop.
  const columns = React.useMemo(
    () => createFacilityColumns(initialSort, initialOrder) as ColumnDef<TData, TValue>[],
    [initialSort, initialOrder],
  );

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [focusRowIndex, setFocusRowIndex] = React.useState(0);
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();
  const initialSearch = initialQ ?? "";

  const [density, setDensity] = React.useState<"comfortable" | "compact">(readDensity);
  const [globalFilter, setGlobalFilter] = React.useState(initialSearch);
  const [statusFilter, setStatusFilter] = React.useState(initialStatus || "all");
  const previousSearchRef = React.useRef(initialSearch);
  const previousStatusRef = React.useRef(initialStatus || "all");

  React.useEffect(() => {
    setGlobalFilter(initialSearch);
    previousSearchRef.current = initialSearch;
  }, [initialSearch]);

  React.useEffect(() => {
    setStatusFilter(initialStatus || "all");
    previousStatusRef.current = initialStatus || "all";
  }, [initialStatus]);

  // Clear selection when page / filter / dataset identity changes (H3)
  React.useEffect(() => {
    setRowSelection({});
    setFocusRowIndex(0);
  }, [currentPage, pageSize, initialSearch, initialStatus, initialSort, initialOrder, data]);

  // Debounced search → URL
  React.useEffect(() => {
    if (globalFilter === previousSearchRef.current) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (globalFilter) params.set("q", globalFilter);
      else params.delete("q");
      params.set("page", "1");
      previousSearchRef.current = globalFilter;
      router.push(`?${params.toString()}`, { scroll: false });
    }, 400);
    return () => clearTimeout(timer);
  }, [globalFilter, router]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    if (value === previousStatusRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (value && value !== "all") params.set("status", value);
    else params.delete("status");
    params.set("page", "1");
    previousStatusRef.current = value;
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleResetFilters = () => {
    setGlobalFilter("");
    setStatusFilter("all");
    previousSearchRef.current = "";
    previousStatusRef.current = "all";
    router.push("?", { scroll: false });
  };

  const toggleDensity = () => {
    const next = density === "comfortable" ? "compact" : "comfortable";
    setDensity(next);
    localStorage.setItem("table-density", next);
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    state: { columnVisibility, rowSelection },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row: Row<TData>) => row.original.id);

  const handleBulkStatusUpdate = (status: FacilityStatus) => {
    if (!selectedIds.length) {
      toast.error("Nije izabran nijedan objekat");
      return;
    }
    startTransition(async () => {
      const result = await bulkUpdateFacilityStatusAction(selectedIds, status);
      if (result.success) {
        setRowSelection({});
        toast.success("Status uspešno ažuriran");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleRowClick = (row: Row<TData>) => {
    router.push(`/admin/facilities/${row.original.id}`, { scroll: false });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("limit", String(size));
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const rows = table.getRowModel().rows;

  const handleTableKeyDown = (e: React.KeyboardEvent) => {
    if (!rows.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusRowIndex((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusRowIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[focusRowIndex];
      if (row) handleRowClick(row);
    } else if (e.key === " ") {
      e.preventDefault();
      const row = rows[focusRowIndex];
      if (row) row.toggleSelected(!row.getIsSelected());
    }
  };

  const hasActiveFilters = Boolean(globalFilter) || Boolean(statusFilter && statusFilter !== "all");

  return (
    <div className="space-y-4">
      <FacilitiesTableToolbar
        search={globalFilter ?? ""}
        onSearchChange={setGlobalFilter}
        status={statusFilter}
        onStatusChange={handleStatusChange}
        totalCount={totalCount}
        density={density}
        onToggleDensity={toggleDensity}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        table={table}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      <FacilitiesBulkBar
        selectedCount={selectedIds.length}
        isPending={isPending}
        onConfirm={handleBulkStatusUpdate}
        onClear={() => setRowSelection({})}
      />

      <div
        className="border-border/50 bg-muted/40 overflow-hidden overflow-x-auto rounded-2xl border shadow-2xl backdrop-blur-md"
        tabIndex={0}
        role="grid"
        aria-label="Registar objekata"
        aria-rowcount={rows.length}
        onKeyDown={handleTableKeyDown}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} role="row">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    role="columnheader"
                    className={cn(
                      "px-3",
                      density === "compact" ? "h-8 py-1 text-[10px]" : "h-10 py-2 text-[11px]",
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  role="row"
                  aria-rowindex={idx + 1}
                  aria-selected={row.getIsSelected() || idx === focusRowIndex}
                  tabIndex={idx === focusRowIndex ? 0 : -1}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "hover:bg-muted/40 focus-visible:ring-primary/40 cursor-pointer focus-visible:ring-1 focus-visible:outline-none",
                    idx === focusRowIndex && "bg-primary/5 ring-primary/30 ring-1",
                  )}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("button, a, input, [role='checkbox']")) return;
                    setFocusRowIndex(idx);
                    handleRowClick(row);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      role="gridcell"
                      className={cn(
                        "px-3",
                        density === "compact" ? "py-1.5 text-xs" : "py-3 text-sm",
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="text-muted-foreground flex flex-col items-center gap-2 py-8">
                    <Icon name="search_off" className="text-[28px] opacity-40" />
                    <p className="text-xs font-bold tracking-wide uppercase">
                      Nema pronađenih objekata
                    </p>
                    <p className="text-[10px]">Podesite pretragu ili filter statusa.</p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-primary mt-1 text-[10px] font-bold tracking-wide uppercase underline-offset-2 hover:underline"
                      >
                        Resetuj filtere
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <FacilitiesTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

// Keep Facility type referenced for consumers
export type FacilitiesDataTableRow = Facility;
