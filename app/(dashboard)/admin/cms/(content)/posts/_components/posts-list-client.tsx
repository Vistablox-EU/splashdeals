"use client";

import { useState, useCallback, startTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  deleteBlogPostAction,
  markAsReviewedAction,
  bulkUpdateBlogPostsAction,
  bulkDeleteBlogPostsAction,
  approvePostAction,
  rejectPostAction,
} from "@/app/(server)/actions/cms/content";
import { CMS_STATUS_LABELS } from "../../../_lib/cms-editor-utils";
import { CMS_STATUS_BADGE_VARIANT, formatCmsDate } from "../../../_lib/cms-list-utils";
import { CmsContentTable } from "../../../_components/cms-content-table";
import type { PostRow } from "./post-types";

export type { PostRow } from "./post-types";

export function PostsListClient({
  posts,
  isStaleFilter,
  isReviewFilter = false,
  isScheduledFilter = false,
}: {
  posts: PostRow[];
  isStaleFilter: boolean;
  isReviewFilter: boolean;
  isScheduledFilter?: boolean;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleDelete = useCallback(
    async (id: string) => {
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

  const handleBulkStatus = useCallback(
    async (ids: string[], status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
      const result = await bulkUpdateBlogPostsAction(ids, status);
      if (result.success) {
        toast.success(`Ažurirano ${result.data?.count ?? 0} objava`);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error(result.error || "Greška");
      }
    },
    [router],
  );

  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      if (!confirm(`Obrisati ${ids.length} objava?`)) return;
      const result = await bulkDeleteBlogPostsAction(ids);
      if (result.success) {
        toast.success(`Obrisano ${result.data?.count ?? 0} objava`);
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
        const result = await approvePostAction(id, "post");
        if (result.success) {
          toast.success("Objava odobrena i objavljena");
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
        const result = await rejectPostAction(id, "post");
        if (result.success) {
          toast.success("Objava vraćena na doradu");
          router.refresh();
        } else {
          toast.error(result.error || "Greška pri vraćanju na doradu");
        }
      });
    },
    [router],
  );

  const toggleSelectAll = useCallback(() => {
    const allIds = posts.map((p) => p.id);
    if (selectedIds.size === allIds.length && allIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }, [selectedIds, posts]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const columns: ColumnDef<PostRow>[] = useMemo(
    () => [
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
            {row.original.status === "REVIEW" && (
              <Badge variant="secondary" className="bg-warning/10 text-warning text-xs">
                Čeka pregled
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
          <Badge variant={CMS_STATUS_BADGE_VARIANT(row.original.status)}>
            {CMS_STATUS_LABELS[row.original.status] || row.original.status}
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
          return <span className="text-muted-foreground text-xs">{formatCmsDate(date)}</span>;
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
                  onClick={() => router.push(`/admin/cms/posts/${row.original.id}`)}
                  aria-label="Uredi objavu"
                >
                  <Icon name="edit" className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      aria-label="Obriši objavu"
                    >
                      <Icon name="delete" className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Obriši objavu?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ova radnja je nepovratna. Objava će biti trajno obrisana.
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
    ],
    [
      selectedIds,
      toggleSelect,
      toggleSelectAll,
      handleApprove,
      handleReject,
      handleMarkReviewed,
      handleDelete,
      router,
    ],
  );

  return (
    <CmsContentTable
      data={posts}
      columns={columns}
      searchPlaceholder="Pretraži objave..."
      statusColumnId="status"
      filterLinks={[
        {
          hrefOn: "/admin/cms/posts?stale=true",
          hrefOff: "/admin/cms/posts",
          active: isStaleFilter,
          label: isStaleFilter ? "Sve objave" : "Stare objave",
          icon: "schedule",
        },
        {
          hrefOn: "/admin/cms/posts?status=review",
          hrefOff: "/admin/cms/posts",
          active: isReviewFilter,
          label: "Na pregledu",
          icon: "visibility",
        },
        {
          hrefOn: "/admin/cms/posts?status=scheduled",
          hrefOff: "/admin/cms/posts",
          active: !!isScheduledFilter,
          label: "Zakazane",
          icon: "schedule",
        },
      ]}
      selectedIds={selectedIds}
      bulkLabel="objava"
      bulkActions={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleMarkReviewed(Array.from(selectedIds))}
          >
            <Icon name="check" className="mr-1 size-3.5" />
            Označi izabrane
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkStatus(Array.from(selectedIds), "PUBLISHED")}
          >
            Objavi
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkStatus(Array.from(selectedIds), "DRAFT")}
          >
            Nacrt
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleBulkDelete(Array.from(selectedIds))}
          >
            <Icon name="delete" className="mr-1 size-3.5" />
            Obriši
          </Button>
        </>
      }
      emptyIcon="description"
      emptyLabel="Nema blog objava"
      emptyCtaLabel="Kreiraj prvu objavu"
      emptyCtaHref="/admin/cms/posts/new"
      countLabel={(n) => `${n} objava`}
    />
  );
}
