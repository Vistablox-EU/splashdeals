"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { cn } from "@/lib/utils";
import { deleteBlogPostAction } from "@/app/(server)/actions/cms";

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Nacrt",
  PUBLISHED: "Objavljeno",
  ARCHIVED: "Arhivirano",
};

interface PostRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  category?: { id: string; name: string; slug: string; color: string | null } | null;
  createdAt: string;
  publishedAt: string | null;
  isFeatured: boolean;
  readingTime: number | null;
  _count?: { tags: number };
}

export function PostsListClient({ posts }: { posts: Array<Record<string, unknown>> }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Da li ste sigurni da želite da obrišete ovu objavu?")) return;
      const result = await deleteBlogPostAction(id);
      if (result.success) {
        toast.success("Objava obrisana");
        router.refresh();
      } else {
        toast.error(result.error || "Greška prilikom brisanja");
      }
    },
    [router],
  );

  const columns: ColumnDef<PostRow>[] = [
    {
      accessorKey: "title",
      header: "Naslov",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="text-left text-sm font-medium">
            <Link href={`/admin/cms/posts/${row.original.id}`}>{row.original.title}</Link>
          </Button>
          {row.original.isFeatured && (
            <Icon name="star" className="fill-warning text-warning size-3.5 shrink-0" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Kategorija",
      cell: ({ row }) => {
        const cat = row.original.category;
        return cat ? (
          <Badge
            variant="outline"
            className="text-xs"
            style={cat.color ? { borderColor: cat.color, color: cat.color } : undefined}
          >
            {cat.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={cn(statusColors[row.original.status] || "")}>
          {statusLabels[row.original.status] || row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "readingTime",
      header: "Čitanje",
      cell: ({ row }) =>
        row.original.readingTime ? (
          <span className="text-muted-foreground text-xs">{row.original.readingTime} min</span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
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
            onClick={() => router.push(`/admin/cms/posts/${row.original.id}`)}
            aria-label="Uredi objavu"
          >
            <Icon name="edit" className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive h-8 w-8 p-0"
            onClick={() => handleDelete(row.original.id)}
            aria-label="Obriši objavu"
          >
            <Icon name="delete" className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
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
  });

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Icon
            name="search"
            className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          />
          <Input
            placeholder="Pretraži objave..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        <Select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) => {
            if (value === "all") {
              table.getColumn("status")?.setFilterValue(undefined);
            } else {
              table.getColumn("status")?.setFilterValue(value);
            }
          }}
        >
          <SelectTrigger aria-label="Filter by status" className="w-[160px]">
            <SelectValue placeholder="Svi statusi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi statusi</SelectItem>
            <SelectItem value="DRAFT">Nacrt</SelectItem>
            <SelectItem value="PUBLISHED">Objavljeno</SelectItem>
            <SelectItem value="ARCHIVED">Arhivirano</SelectItem>
          </SelectContent>
        </Select>
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
                  <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Icon name="article" className="size-8" />
                    <p className="text-sm">Nema blog objava</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/admin/cms/posts/new")}
                    >
                      <Icon name="add" className="mr-1 size-4" />
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
        <p className="text-muted-foreground text-xs">
          {table.getFilteredRowModel().rows.length} objava
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
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
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
