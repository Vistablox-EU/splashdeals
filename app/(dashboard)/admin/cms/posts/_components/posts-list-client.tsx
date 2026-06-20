"use client"

import { useState, useCallback, useTransition } from "react"
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
import { Badge } from "@/components/ui/badge"
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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  deleteBlogPostAction,
  bulkUpdateBlogPostsAction,
  bulkDeleteBlogPostsAction,
} from "@/app/(server)/actions/cms"

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

interface PostRow {
  id: string
  title: string
  slug: string
  status: string
  category?: { id: string; name: string; slug: string; color: string | null } | null
  createdAt: string
  publishedAt: string | null
  isFeatured: boolean
  readingTime: number | null
  _count?: { tags: number }
}

export function PostsListClient({
  posts,
}: {
  posts: Array<Record<string, unknown>>
}) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // Add checkbox column as first column
  const checkboxColumn: ColumnDef<PostRow> = {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        className="size-4 cursor-pointer"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        className="size-4 cursor-pointer"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        aria-label={`Select ${row.original.title}`}
      />
    ),
  }

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Da li ste sigurni da želite da obrišete ovu objavu?")) return
    const result = await deleteBlogPostAction(id)
    if (result.success) {
      toast.success("Objava obrisana")
      router.refresh()
    } else {
      toast.error(result.error || "Greška prilikom brisanja")
    }
  }, [router])

  const columns: ColumnDef<PostRow>[] = [
    {
      accessorKey: "title",
      header: "Naslov",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/admin/cms/posts/${row.original.id}`)}
            className="font-medium text-sm hover:text-primary transition-colors text-left"
          >
            {row.original.title}
          </button>
          {row.original.isFeatured && (
            <Icon name="star" className="size-3.5 fill-amber-400 text-amber-400 shrink-0" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Kategorija",
      cell: ({ row }) => {
        const cat = row.original.category
        return cat ? (
          <Badge
            variant="outline"
            className="text-xs"
            style={cat.color ? { borderColor: cat.color, color: cat.color } : undefined}
          >
            {cat.name}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      },
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
      accessorKey: "readingTime",
      header: "Čitanje",
      cell: ({ row }) =>
        row.original.readingTime ? (
          <span className="text-xs text-muted-foreground">{row.original.readingTime} min</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "publishedAt",
      header: "Objavljeno",
      cell: ({ row }) => {
        const date = row.original.publishedAt || row.original.createdAt
        return (
          <span className="text-xs text-muted-foreground">
            {formatDate(date)}
          </span>
        )
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
            onClick={() => router.push(`/admin/cms/posts/${row.original.id}`)}
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
    data: posts as unknown as PostRow[],
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
      {/* Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Icon
            name="search"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          />
          <Input
            placeholder="Pretraži objave..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("status")?.setFilterValue(e.target.value || undefined)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          aria-label="Filter by status"
        >
          <option value="">Svi statusi</option>
          <option value="DRAFT">Nacrt</option>
          <option value="PUBLISHED">Objavljeno</option>
          <option value="ARCHIVED">Arhivirano</option>
        </select>
      </div>

      {/* Table */}
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
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Icon name="article" className="size-8" />
                    <p className="text-sm">Nema blog objava</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/admin/cms/posts/new")}
                    >
                      <Icon name="add" className="size-4 mr-1" />
                      Kreiraj prvu objavu
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} objava
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <Icon name="chevron_left" className="size-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
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
