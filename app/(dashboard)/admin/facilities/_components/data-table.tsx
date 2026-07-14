"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { bulkUpdateFacilityStatusAction } from "@/app/(server)/actions/facilities";
import { FacilityStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  initialQ?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalCount,
  currentPage,
  pageSize,
  initialQ,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();
  const initialSearch = initialQ ?? "";

  const [density, setDensity] = React.useState<"comfortable" | "compact">("compact");

  React.useEffect(() => {
    const saved = localStorage.getItem("table-density");
    if (saved === "comfortable" || saved === "compact") {
      setDensity(saved);
    }
  }, []);

  const toggleDensity = (val: "comfortable" | "compact") => {
    setDensity(val);
    localStorage.setItem("table-density", val);
  };

  const [globalFilter, setGlobalFilter] = React.useState(initialSearch);
  const previousSearchRef = React.useRef(initialSearch);

  // 🔄 Synchronize query parameter changes from URL back to state (e.g. Back/Forward or Clear Filters)
  React.useEffect(() => {
    setGlobalFilter(initialSearch);
    previousSearchRef.current = initialSearch;
  }, [initialSearch]);

  // 🧠 Debounced Search Optimization
  React.useEffect(() => {
    if (globalFilter === previousSearchRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (globalFilter) {
        params.set("q", globalFilter);
      } else {
        params.delete("q");
      }
      params.set("page", "1"); // Reset to first page on search
      previousSearchRef.current = globalFilter;
      router.push(`?${params.toString()}`, { scroll: false });
    }, 400);

    return () => clearTimeout(timer);
  }, [globalFilter, router]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<TData>({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row: Row<TData>) => (row.original as { id: string }).id);

  const handleBulkStatusUpdate = (status: FacilityStatus) => {
    startTransition(async () => {
      const result = await bulkUpdateFacilityStatusAction(selectedIds, status);
      if (result.success) {
        setRowSelection({});
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleRowClick = (row: Row<TData>) => {
    const id = (row.original as { id: string }).id;
    router.push(`/admin/facilities/${id}`, { scroll: false });
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <div className="bg-background/40 border-border/50 flex flex-col items-stretch justify-between gap-3 rounded-xl border p-2 backdrop-blur-md lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Icon
              name="search"
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-[14px]"
            />
            <Input
              placeholder="Pretraži registar..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              aria-label="Search facilities"
              className="bg-background/40 border-border/50 focus-visible:ring-primary/30 placeholder:text-muted-foreground h-9 pl-9 text-xs font-semibold focus-visible:ring-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
              onValueChange={(value) =>
                table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="bg-background/40 border-border/50 hover:bg-background/60 relative h-9 flex-1 text-[10px] font-black tracking-wider uppercase transition-colors sm:w-[160px]">
                <SelectValue placeholder="Status" />
                <Badge
                  variant="outline"
                  className="bg-primary/10 border-primary/20 text-primary pointer-events-none ml-2 h-5 px-1.5 text-[9px] font-black"
                >
                  {totalCount}
                </Badge>
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="all">Svi statusi</SelectItem>
                <SelectItem value="ACTIVE">Aktivni</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="EMERGENCY_SHUTDOWN">Shutdown</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 h-9 w-9 shrink-0 rounded-lg"
              onClick={() => toggleDensity(density === "comfortable" ? "compact" : "comfortable")}
              title={
                density === "comfortable" ? "Switch to Compact View" : "Switch to Comfortable View"
              }
              aria-label={
                density === "comfortable" ? "Switch to Compact View" : "Switch to Comfortable View"
              }
            >
              {density === "comfortable" ? (
                <Icon name="table_rows" className="text-[16px]" />
              ) : (
                <Icon name="menu" className="text-[16px]" />
              )}
            </Button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="bg-primary/10 border-primary/20 flex items-center gap-2 rounded-lg border p-1 px-3">
            <span className="text-primary mr-2 text-[9px] font-black tracking-[0.2em] uppercase">
              {selectedIds.length} Izabrano
            </span>
            <div className="bg-primary/20 mx-1 h-4 w-px" />
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-primary/20 hover:text-primary h-7 text-[10px] font-bold tracking-tight uppercase"
              onClick={() => handleBulkStatusUpdate("ACTIVE")}
              disabled={isPending}
            >
              {isPending ? (
                <Icon name="progress_activity" className="mr-1 animate-spin text-[12px]" />
              ) : (
                <Icon name="check_circle" className="mr-1 text-[12px]" />
              )}
              Aktiviraj
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-destructive/20 hover:text-destructive h-7 text-[10px] font-bold tracking-tight uppercase"
              onClick={() => handleBulkStatusUpdate("CLOSED")}
              disabled={isPending}
            >
              {isPending ? (
                <Icon name="progress_activity" className="mr-1 animate-spin text-[12px]" />
              ) : (
                <Icon name="archive" className="mr-1 text-[12px]" />
              )}
              Arhiviraj
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-muted/50 h-7 w-7 p-0"
              onClick={() => setRowSelection({})}
              disabled={isPending}
              aria-label="Obriši izbor"
            >
              <Icon name="cancel" className="text-muted-foreground text-[14px]" />
            </Button>
          </div>
        )}
      </div>

      <div className="border-border/50 bg-muted/40 overflow-hidden overflow-x-auto rounded-2xl border shadow-2xl backdrop-blur-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "px-3",
                        density === "compact" ? "h-8 py-1 text-[10px]" : "h-10 py-2 text-[11px]",
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {data?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group hover:bg-muted/50 data-[state=selected]:bg-muted relative transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "cursor-pointer px-3",
                        density === "compact" ? "py-1 text-[11px]" : "py-2 text-xs",
                      )}
                      onClick={() =>
                        cell.column.id !== "select" &&
                        cell.column.id !== "actions" &&
                        handleRowClick(row)
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-[400px] text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-4">
                      <div className="bg-primary/5 absolute -inset-4 animate-pulse rounded-full blur-2xl" />
                      <div className="bg-muted border-border/50 text-muted-foreground group-hover:text-primary relative flex size-16 items-center justify-center rounded-xl border transition-colors">
                        {globalFilter || columnFilters.length > 0 ? (
                          <Icon name="search_off" className="size-8" />
                        ) : (
                          <Icon name="business" className="size-8" />
                        )}
                      </div>
                    </div>

                    <h3 className="text-foreground mb-1 text-lg font-bold">
                      {globalFilter || columnFilters.length > 0
                        ? "No facilities match your filters"
                        : "No facilities registered yet"}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-[280px] text-sm">
                      {globalFilter || columnFilters.length > 0
                        ? "Try adjusting your search terms or filters to find the facility you're looking for."
                        : "Start building your marketplace by onboarding your first facility."}
                    </p>

                    <div className="flex items-center gap-3">
                      {globalFilter || columnFilters.length > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGlobalFilter("");
                            setColumnFilters([]);
                          }}
                          className="border-border hover:bg-muted/30 h-10 rounded-xl px-6"
                        >
                          Clear all filters
                        </Button>
                      ) : (
                        <Button
                          onClick={() => router.push("/admin/facilities/new")}
                          className="hover:bg-muted bg-foreground text-background h-10 rounded-xl px-6 font-bold"
                        >
                          <Icon name="add" className="mr-2 size-4" />
                          Register First Facility
                        </Button>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">
          {currentPage} / {totalPages || 1} • {totalCount} Total
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-background/40 border-border/50 h-8 w-8 p-0"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <Icon name="keyboard_arrow_left" className="text-[16px]" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-background/40 border-border/50 h-8 w-8 p-0"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <Icon name="keyboard_arrow_right" className="text-[16px]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
