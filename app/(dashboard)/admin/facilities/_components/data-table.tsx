"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
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
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { bulkUpdateFacilityStatusAction } from "@/server/actions/facilities"
import { FacilityStatus } from "@prisma/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  totalCount: number
  currentPage: number
  pageSize: number
  initialQ?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalCount,
  currentPage,
  pageSize,
  initialQ,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [isPending, startTransition] = React.useTransition()
  const router = useRouter()
  const initialSearch = initialQ ?? ""

  const [density, setDensity] = React.useState<"comfortable" | "compact">("compact")

  React.useEffect(() => {
    const saved = localStorage.getItem("table-density")
    if (saved === "comfortable" || saved === "compact") {
      setDensity(saved)
    }
  }, [])

  const toggleDensity = (val: "comfortable" | "compact") => {
    setDensity(val)
    localStorage.setItem("table-density", val)
  }

  const [globalFilter, setGlobalFilter] = React.useState(initialSearch)
  const previousSearchRef = React.useRef(initialSearch)

  // 🔄 Synchronize query parameter changes from URL back to state (e.g. Back/Forward or Clear Filters)
  React.useEffect(() => {
    setGlobalFilter(initialSearch)
    previousSearchRef.current = initialSearch
  }, [initialSearch])

  // 🧠 Debounced Search Optimization
  React.useEffect(() => {
    if (globalFilter === previousSearchRef.current) {
      return
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      if (globalFilter) {
        params.set("q", globalFilter)
      } else {
        params.delete("q")
      }
      params.set("page", "1") // Reset to first page on search
      previousSearchRef.current = globalFilter
      router.push(`?${params.toString()}`, { scroll: false })
    }, 400)

    return () => clearTimeout(timer)
  }, [globalFilter, router])

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
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedIds = selectedRows.map((row: Row<TData>) => (row.original as { id: string }).id)

  const handleBulkStatusUpdate = (status: FacilityStatus) => {
    startTransition(async () => {
      const result = await bulkUpdateFacilityStatusAction(selectedIds, status)
      if (result.success) {
        setRowSelection({})
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleRowClick = (row: Row<TData>) => {
    const id = (row.original as { id: string }).id
    router.push(`/admin/facilities/${id}`, { scroll: false })
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set("page", newPage.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-2 bg-background/40 border border-border/50 rounded-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-muted-foreground" />
            <Input
              placeholder="Search registry..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9 h-9 bg-background/40 border-border/50 focus-visible:ring-1 focus-visible:ring-cyan-500/30 text-xs font-semibold placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Select
              value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
              onValueChange={(value) => 
                table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="flex-1 sm:w-[160px] h-9 bg-background/40 border-border/50 text-[10px] font-black uppercase tracking-wider relative hover:bg-background/60 transition-colors">
                <SelectValue placeholder="Status" />
                <Badge variant="outline" className="ml-2 h-5 px-1.5 bg-cyan-500/10 border-cyan-500/20 text-[9px] font-black pointer-events-none text-cyan-400">
                  {totalCount}
                </Badge>
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="EMERGENCY_SHUTDOWN">Shutdown</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg shrink-0"
              onClick={() => toggleDensity(density === "comfortable" ? "compact" : "comfortable")}
              title={density === "comfortable" ? "Switch to Compact View" : "Switch to Comfortable View"}
            >
              {density === "comfortable" ? <Icon name="table_rows" className="text-[16px]" /> : <Icon name="menu" className="text-[16px]" />}
            </Button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 p-1 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mr-2">
              {selectedIds.length} Selected
            </span>
            <div className="h-4 w-px bg-emerald-500/20 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] font-bold uppercase tracking-tight hover:bg-emerald-500/20 hover:text-emerald-400"
              onClick={() => handleBulkStatusUpdate("ACTIVE")}
              disabled={isPending}
            >
              {isPending ? <Icon name="progress_activity" className="text-[12px] animate-spin mr-1" /> : <Icon name="check_circle" className="text-[12px] mr-1" />}
              Activate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] font-bold uppercase tracking-tight hover:bg-amber-500/20 hover:text-amber-400"
              onClick={() => handleBulkStatusUpdate("CLOSED")}
              disabled={isPending}
            >
              {isPending ? <Icon name="progress_activity" className="text-[12px] animate-spin mr-1" /> : <Icon name="archive" className="text-[12px] mr-1" />}
              Archive
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-muted/50"
              onClick={() => setRowSelection({})}
              disabled={isPending}
            >
              <Icon name="cancel" className="text-[14px] text-muted-foreground" />
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/50 bg-muted/40 backdrop-blur-md overflow-hidden overflow-x-auto shadow-2xl">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className={cn("px-3", density === "compact" ? "h-8 py-1 text-[10px]" : "h-10 py-2 text-[11px]")}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
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
                  className="relative group transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id} 
                      className={cn("px-3 cursor-pointer", density === "compact" ? "py-1 text-[11px]" : "py-2 text-xs")}
                      onClick={() => cell.column.id !== "select" && cell.column.id !== "actions" && handleRowClick(row)}
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
                      <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl animate-pulse" />
                      <div className="relative size-16 rounded-xl bg-muted border border-border/50 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                        {globalFilter || columnFilters.length > 0 ? (
                          <Icon name="search_off" className="size-8" />
                        ) : (
                          <Icon name="business" className="size-8" />
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {globalFilter || columnFilters.length > 0 
                        ? "No facilities match your filters" 
                        : "No facilities registered yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-[280px] mb-6">
                      {globalFilter || columnFilters.length > 0
                        ? "Try adjusting your search terms or filters to find the facility you're looking for."
                        : "Start building your marketplace by onboarding your first facility."}
                    </p>
                    
                    <div className="flex items-center gap-3">
                      {(globalFilter || columnFilters.length > 0) ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setGlobalFilter("")
                            setColumnFilters([])
                          }}
                          className="h-10 px-6 rounded-xl border-border hover:bg-muted/30"
                        >
                          Clear all filters
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => router.push("/admin/facilities/new")}
                          className="h-10 px-6 rounded-xl bg-white text-black font-bold hover:bg-muted"
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
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          {currentPage} / {totalPages || 1} • {totalCount} Total
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-background/40 border-border/50"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <Icon name="keyboard_arrow_left" className="text-[16px]" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-background/40 border-border/50"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <Icon name="keyboard_arrow_right" className="text-[16px]" />
          </Button>
        </div>
      </div>
    </div>
  )
}
