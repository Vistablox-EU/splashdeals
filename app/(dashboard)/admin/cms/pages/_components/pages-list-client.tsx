"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
} from "@tanstack/react-table"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { deletePageAction } from "@/app/(server)/actions/cms"

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
}

const statusLabels: Record<string, string> = {
  DRAFT: "Nacrt",
  PUBLISHED: "Objavljeno",
  ARCHIVED: "Arhivirano",
}

interface PageRow {
  id: string
  title: string
  slug: string
  status: string
  template: string
  createdAt: string
  publishedAt: string | null
}

export function PagesListClient({ pages }: { pages: Array<Record<string, unknown>> }) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Da li ste sigurni da želite da obrišete ovu stranu?")) return
    const result = await deletePageAction(id)
    if (result.success) {
      toast.success("Strana obrisana")
      router.refresh()
    } else {
      toast.error(result.error || "Greška prilikom brisanja")
    }
  }, [router])

  const columns: ColumnDef<PageRow>[] = [
    {
      accessorKey: "title",
      header: "Naslov",
      cell: ({ row }) => (
        <button
          onClick={() => router.push(`/admin/cms/pages/${row.original.id}`)}
          className="font-medium text-sm hover:text-primary transition-colors text-left"
        >
          {row.original.title}
        </button>
      ),
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <code className="text-xs text-muted-foreground">/{row.original.slug}</code>
      ),
    },
    {
      accessorKey: "template",
      header: "Šablon",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground capitalize">
          {row.original.template === "default" ? "Podrazumevani" : row.original.template}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            statusColors[row.original.status] || ""
          )}
        >
          {statusLabels[row.original.status] || row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "publishedAt",
      header: "Objavljeno",
      cell: ({ row }) => {
        const date = row.original.publishedAt || row.original.createdAt
        return <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => router.push(`/admin/cms/pages/${row.original.id}`)}
          >
            <Icon name="edit" className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => handleDelete(row.original.id)}
          >
            <Icon name="delete" className="size-4" />
          </Button>
        </div>
      ),
    },
  ]

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
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži strane..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
            className="pl-8 h-9"
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
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Icon name="file_text" className="size-8" />
                    <p className="text-sm">Nema strana</p>
                    <Button variant="outline" size="sm" onClick={() => router.push("/admin/cms/pages/new")}>
                      <Icon name="add" className="size-4 mr-1" />
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
        <p className="text-xs text-muted-foreground">{table.getFilteredRowModel().rows.length} strana</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <Icon name="chevron_left" className="size-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <Icon name="chevron_right" className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("sr-RS", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
