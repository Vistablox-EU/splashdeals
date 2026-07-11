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
import { Checkbox } from "@/components/ui/checkbox";
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
import { deleteBlogPostAction, markAsReviewedAction } from "@/app/(server)/actions/cms";

const statusLabels: Record<string, string> = {
  DRAFT: "Nacrt",
  PUBLISHED: "Objavljeno",
  ARCHIVED: "Arhivirano",
};

const statusBadgeVariant = (status: string): "default" | "secondary" | "outline" => {
  switch (status) {
    case "PUBLISHED":
      return "default";
    case "DRAFT":
      return "secondary";
    default:
      return "outline";
  }
};

interface PostRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  category?: { id: string; name: string; slug: string; color: string | null } | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  publishedAt: string | null;
  isFeatured: boolean;
  readingTime: number | null;
  isStale: boolean;
  _count?: { tags: number };
}

export function PostsListClient({
  posts,
  isStaleFilter,
}: {
  posts: Array<Record<string, unknown>>;
  isStaleFilter: boolean;
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const handleMarkReviewed = useCallback(
    async (ids: string[]) => {
      const result = await markAsReviewedAction(ids, "post");
      if (result.success) {
        toast.success(`Označeno ${result.data?.updated ?? 0} objava kao aktuelno`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error(result.error || "Greška");
      }
    },
    [router],
  );

  const toggleSelectAll = useCallback(() => {
    const allIds = (table.getFilteredRowModel().rows ?? []).map((r) => r.original.id);
    if (selectedIds.size === allIds.length && allIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }, [selectedIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const columns: ColumnDef<PostRow>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const allIds = table.getFilteredRowModel().rows.map((r) => r.original.id);
        const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
        return (
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
            aria-label="Izaberi sve"
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => toggleSelect(row.original.id)}
          aria-label={`Izaberi ${row.original.title}`}
        />
      ),
    },
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
          {row.original.isStale && (
            <Badge variant="secondary" className="bg-warning/10 text-warning text-xs">
              Starija od 12 meseci
            </Badge>
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
        <Badge variant={statusBadgeVariant(row.original.status)}>
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
          {row.original.isStale && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleMarkReviewed([row.original.id])}
            >
              I dalje je aktuelno
            </Button>
          )}
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
        <Button variant={isStaleFilter ? "default" : "outline"} size="sm" asChild>
          <Link href={isStaleFilter ? "/admin/cms/posts" : "/admin/cms/posts?stale=true"}>
            <Icon name="clock" className="size-3.5" />
            {isStaleFilter ? "Sve objave" : "Stare objave"}
          </Link>
        </Button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Izabrano: {selectedIds.size} objava</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleMarkReviewed(Array.from(selectedIds))}
          >
            <Icon name="check" className="mr-1 size-3.5" />
            Označi izabrane
          </Button>
        </div>
      )}

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
