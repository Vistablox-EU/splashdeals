"use client";

import { cn } from "@/lib/utils";
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { MediaGrid } from "./media-grid";
import { MediaSearch } from "./media-search";
import { MediaToolbar } from "./media-toolbar";
import { MediaUploadZone } from "./media-upload-zone";
import { MediaUploadProgress } from "./media-upload-progress";
import { MediaDetailPane } from "./media-detail-pane";
import { uploadMediaAction, uploadMediaFromUrlAction } from "@/app/(server)/actions/cms-media";

interface UploadItem {
  id: string;
  filename: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

interface MediaLibraryContentProps {
  dict: Record<string, unknown>;
  onSelect: (url: string, altText?: string) => void;
  actionLabel?: string;
}

export function MediaLibraryContent({ dict, onSelect, actionLabel }: MediaLibraryContentProps) {
  const ml = dict as Record<string, unknown>;
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sizeMode, setSizeMode] = useState<"small" | "medium" | "large">("medium");
  const [refreshKey, setRefreshKey] = useState(0);

  // Shared upload handler
  const handleFilesSelected = useCallback(async (files: File[]) => {
    for (const file of files) {
      const uploadId = crypto.randomUUID();
      const uploadItem: UploadItem = {
        id: uploadId,
        filename: file.name,
        progress: 0,
        status: "uploading",
      };
      setUploads((prev) => [...prev, uploadItem]);

      try {
        // Client-side WebP conversion
        let uploadFile = file;
        if (
          file.type.startsWith("image/") &&
          file.type !== "image/svg+xml" &&
          file.type !== "image/gif"
        ) {
          try {
            const canvas = document.createElement("canvas");
            const bitmap = await createImageBitmap(file);
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(bitmap, 0, 0);
            const webpBlob = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob(resolve, "image/webp", 0.85),
            );
            if (webpBlob) {
              uploadFile = new File([webpBlob], file.name.replace(/\.[^.]+$/, ".webp"), {
                type: "image/webp",
              });
            }
          } catch {
            // Fall through — server-side sharp handles it
          }
        }

        const formData = new FormData();
        formData.append("file", uploadFile);

        const result = await uploadMediaAction(formData);

        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? {
                  ...u,
                  status: result.success ? "done" : "error",
                  error: result.success ? undefined : result.error,
                  progress: result.success ? 100 : 0,
                }
              : u,
          ),
        );

        if (result.success) {
          const r = result as {
            success: true;
            data: { id: string; url: string };
            warning?: string;
          };
          if (r.warning) {
            toast.warning(r.warning);
          }
          setRefreshKey((k) => k + 1);
        } else {
          toast.error(result.error || "Greška pri uploadu");
        }
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId ? { ...u, status: "error", error: "Neočekivana greška" } : u,
          ),
        );
      }
    }

    // Clear done/error items after 4 seconds
    setTimeout(() => {
      setUploads((prev) => prev.filter((u) => u.status === "uploading"));
    }, 4000);
  }, []);

  const handlePasteUrl = useCallback(async (url: string) => {
    const result = await uploadMediaFromUrlAction(url);
    if (result.success) {
      toast.success("Slika uvezena");
      setRefreshKey((k) => k + 1);
    } else {
      toast.error(result.error || "Greška pri uvozu");
    }
  }, []);

  const handleBatchDelete = useCallback(() => {
    // Handled by the delete dialog
  }, []);

  const handleSelectFromGrid = useCallback((id: string) => {
    // Toggle selection
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handlePreview = useCallback((id: string) => {
    setPreviewId((prev) => (prev === id ? null : id));
  }, []);

  const filterProps = {
    sort,
    onSortChange: setSort,
    typeFilter,
    onTypeFilterChange: setTypeFilter,
    dateRange,
    onDateRangeChange: setDateRange,
    viewMode,
    onViewModeChange: setViewMode,
    sizeMode,
    onSizeModeChange: setSizeMode,
    selectedCount: selectedIds.size,
    onBatchDelete: handleBatchDelete,
    dict: ml,
  } as any;

  return (
    <div className="flex h-full flex-col">
      {/* Upload zone at top */}
      <div className="shrink-0 px-4 pt-4">
        <MediaUploadZone
          {...({
            dict: ml,
            onFilesSelected: handleFilesSelected,
            onPasteUrl: handlePasteUrl,
          } as any)}
        />
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="shrink-0 px-4 pt-2">
          <MediaUploadProgress uploads={uploads} />
        </div>
      )}

      {/* Search + toolbar row */}
      <div className="shrink-0 space-y-2 px-4 pt-4">
        <MediaSearch
          value={search}
          onChange={setSearch}
          placeholder={(ml as Record<string, unknown>).search_placeholder as string}
          dict={ml}
        />
        <MediaToolbar {...(filterProps as any)} />
      </div>

      {/* Grid + optional detail pane */}
      <div className="flex flex-1 overflow-hidden">
        <div
          className={cn(
            "flex-1 overflow-y-auto p-4",
            previewId ? "lg:w-[calc(100%-400px)]" : "w-full",
          )}
        >
          <MediaGrid
            key={refreshKey}
            dict={ml}
            onSelect={handleSelectFromGrid}
            onPreview={handlePreview}
            onItemAction={onSelect}
            selectedIds={selectedIds}
            search={search}
            sort={sort}
            typeFilter={typeFilter}
            dateRange={dateRange}
            actionLabel={actionLabel || (ml.actions as Record<string, string>)?.select || "Izaberi"}
          />
        </div>

        {/* Split-pane detail */}
        {previewId && (
          <div className="hidden w-[400px] shrink-0 border-l lg:block">
            <MediaDetailPane
              mediaId={previewId}
              dict={ml as any}
              onClose={() => setPreviewId(null)}
              onSelect={onSelect}
              onDelete={() => {
                setPreviewId(null);
                setRefreshKey((k) => k + 1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
