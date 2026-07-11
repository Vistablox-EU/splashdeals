"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { MediaThumbnail } from "./media-thumbnail";
import { MediaEmptyState } from "./media-empty-state";
import { listMediaAction } from "@/app/(server)/actions/cms-media";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  collection: string | null;
  createdAt: string;
}

interface MediaGridProps {
  dict: Record<string, unknown>;
  onSelect: (id: string) => void;
  onPreview: (id: string) => void;
  onItemAction: (url: string, altText?: string) => void;
  selectedIds: Set<string>;
  search: string;
  sort: string;
  typeFilter: string;
  dateRange: string;
  collectionFilter: string;
  sizeMode: string;
  actionLabel: string;
  usageMap?: Record<string, { count: number; posts: string[]; pages: string[] }>;
}

export function MediaGrid({
  dict,
  onSelect,
  onPreview,
  onItemAction,
  selectedIds,
  search,
  sort,
  typeFilter,
  dateRange,
  actionLabel,
  usageMap,
  collectionFilter,
  sizeMode,
}: MediaGridProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<string | null>(null);

  const ml = dict as Record<string, unknown>;
  const actions = (ml.actions as Record<string, string>) || {};

  // Reset and refetch when filters change
  useEffect(() => {
    startTransition(() => {
      setItems([]);
      setNextCursor(null);
      cursorRef.current = null;
      setLoading(true);
      setError(null);
    });

    const fetchFirst = async () => {
      try {
        const result = await listMediaAction({
          search: search || undefined,
          sort: sort as "newest" | "oldest" | "name_asc" | "name_desc" | "largest" | "smallest",
          type: typeFilter as "all" | "jpg" | "png" | "webp" | "gif" | "svg",
          dateRange: dateRange as "all" | "7d" | "30d",
          collection: collectionFilter || undefined,
          limit: 50,
        });
        if (result.success && result.data) {
          setItems(result.data.items);
          setNextCursor(result.data.nextCursor);
          cursorRef.current = result.data.nextCursor;
        } else {
          setError(result.error || "Greška pri učitavanju");
        }
      } catch {
        setError("Greška pri učitavanju medija.");
      } finally {
        setLoading(false);
      }
    };

    fetchFirst();
  }, [search, sort, typeFilter, dateRange, collectionFilter]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !nextCursor) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          setLoadingMore(true);
          try {
            const result = await listMediaAction({
              cursor: nextCursor,
              search: search || undefined,
              sort: sort as "newest" | "oldest" | "name_asc" | "name_desc" | "largest" | "smallest",
              type: typeFilter as "all" | "jpg" | "png" | "webp" | "gif" | "svg",
              dateRange: dateRange as "all" | "7d" | "30d",
              limit: 50,
            });
            if (result.success && result.data) {
              setItems((prev) => [...prev, ...result.data!.items]);
              setNextCursor(result.data!.nextCursor);
            }
          } catch {
            // Silently fail on scroll — user can retry by scrolling again
          } finally {
            setLoadingMore(false);
          }
        }
      },
      { rootMargin: "200px" },
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, search, sort, typeFilter, dateRange]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full rounded-[1rem]" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Icon name="error" className="text-destructive size-12" />
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {(actions.retry || "Pokušaj ponovo") as string}
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return <MediaEmptyState dict={ml} onUpload={() => {}} />;
  }

  const gridCols =
    sizeMode === "large"
      ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      : sizeMode === "small"
        ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7"
        : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

  return (
    <div>
      <div className={`grid gap-3 ${gridCols}`}>
        {items.map((item) => (
          <MediaThumbnail
            key={item.id}
            id={item.id}
            url={item.url}
            filename={item.filename}
            size={item.size}
            mimeType={item.mimeType}
            altText={item.altText}
            createdAt={item.createdAt}
            width={item.width ?? null}
            height={item.height ?? null}
            usageCount={usageMap?.[item.id]?.count ?? 0}
            isSelected={selectedIds.has(item.id)}
            onSelect={() => onSelect(item.id)}
            onPreview={() => onPreview(item.id)}
            onAction={(url, alt) => onItemAction(url, alt)}
            actionLabel={actionLabel}
            dict={ml}
          />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <div className="flex justify-center py-4">
          <Icon name="refresh" className="text-muted-foreground size-5 animate-spin" />
        </div>
      )}

      {!nextCursor && items.length > 0 && (
        <p className="text-muted-foreground mt-4 text-center text-xs">
          {((ml.items_shown as string) || "").replace("{shown}", String(items.length)) ||
            `Prikazano ${items.length} medija`}
        </p>
      )}
    </div>
  );
}
