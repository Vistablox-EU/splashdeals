"use client";

import { useState, useCallback, startTransition } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  deletePageAction,
  markAsReviewedAction,
  approvePostAction,
  rejectPostAction,
} from "@/app/(server)/actions/cms/content";

const statusLabels: Record<string, string> = {
  DRAFT: "Nacrt",
  PUBLISHED: "Objavljeno",
  ARCHIVED: "Arhivirano",
  REVIEW: "Na pregledu",
};

interface PageRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  template: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  publishedAt: string | null;
  isStale: boolean;
}

export function PagesListClient({
  pages,
  isStaleFilter,
  isReviewFilter = false,
}: {
  pages: Array<Record<string, unknown>>;
  isStaleFilter: boolean;
  isReviewFilter: boolean;
}) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const statusBadgeVariant = (status: string): "default" | "secondary" | "outline" => {
    switch (status) {
      case "PUBLISHED":
        return "default";
      case "DRAFT":
        return "secondary";
      case "REVIEW":
        return "secondary";
      case "ARCHIVED":
        return "outline";
      default:
        return "secondary";
    }
  };

  const handleDelete = useCallback(
    async (id: string) => {
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

  const handleMarkReviewed = useCallback(
    async (ids: string[]) => {
      const result = await markAsReviewedAction(ids, "page");
      if (result.success) {
        toast.success(`Označeno ${result.data?.updated ?? 0} strana kao aktuelno`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error(result.error || "Greška");
      }
    },
    [router],
  );

  const handleApprove = useCallback(
    (id: string) => {
      startTransition(async () => {
        const result = await approvePostAction(id, "page");
        if (result.success) {
          toast.success("Strana odobrena i objavljena");
          router.refresh();
        } else {
          toast.error(result.error || "Greška pri odobravanju");
        }
      });
    },
    [router],
  );

  const handleReject = useCallback(
    (id: string) => {
      startTransition(async () => {
        const result = await rejectPostAction(id, "page");
        if (result.success) {
          toast.success("Strana vraćena na doradu");
          router.refresh();
        } else {
          toast.error(result.error || "Greška pri vraćanju na doradu");
        }
      });
    },
    [router],
  );

  const toggleSelectAll = useCallback(() => {
    const allIds = (pages as Array<Record<string, unknown>>).map((p) => p.id as string);
    if (selectedIds.size === allIds.length && allIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }, [selectedIds, pages]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const columns: ColumnDef<PageRow>[] = [
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
          <Button
            variant="link"
            className="h-auto p-0 text-left text-sm font-medium"
            onClick={() => router.push(`/admin/cms/pages/${row.original.id}`)}
          >
            {row.original.title}
          </Button>
          {row.original.isStale && (
            <Badge variant="secondary" className="bg-warning/10 text-warning text-xs">
              Starija od 12 meseci
            </Badge>
          )}
          {row.original.status === "REVIEW" && (
            <Badge variant="secondary" className="bg-warning/10 text-warning text-xs">
              Čeka pregled
            </Badge>
          )}
        </div>
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
          {row.original.status === "REVIEW" ? (
            <>
              <Button
                variant="default"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleApprove(row.original.id)}
              >
                Odobri
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleReject(row.original.id)}
              >
                Vrati na doradu
              </Button>
            </>
          ) : (
            <>
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
                aria-label={`Izmeni stranu ${row.original.title}`}
                onClick={() => router.push(`/admin/cms/pages/${row.original.id}`)}
              >
                <Icon name="edit" className="size-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    aria-label={`Obriši stranu ${row.original.title}`}
                  >
                    <Icon name="delete" className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Obriši stranu?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ova radnja je nepovratna. Strana će biti trajno obrisana.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Odustani</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => handleDelete(row.original.id)}
                    >
                      Obriši
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      ),
    },
  ];

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
        <Button variant={isStaleFilter ? "default" : "outline"} size="sm" asChild>
          <Link href={isStaleFilter ? "/admin/cms/pages" : "/admin/cms/pages?stale=true"}>
            <Icon name="clock" className="size-3.5" />
            {isStaleFilter ? "Sve strane" : "Stare strane"}
          </Link>
        </Button>
        <Button variant={isReviewFilter ? "default" : "outline"} size="sm" asChild>
          <Link href={isReviewFilter ? "/admin/cms/pages" : "/admin/cms/pages?status=review"}>
            <Icon name="eye" className="size-3.5" />
            Na pregledu
          </Link>
        </Button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Izabrano: {selectedIds.size} strana</span>
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
