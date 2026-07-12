"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback, useRef } from "react";
import { getMediaAction, updateMediaAction } from "@/app/(server)/actions/cms-media";
import { MediaDeleteDialog } from "./media-delete-dialog";

interface MediaDetailDict {
  details: {
    title: string;
    name: string;
    size: string;
    dimensions: string;
    type: string;
    uploaded_at: string;
    alt_text: string;
    used_in: string;
    posts: string;
    pages: string;
    close: string;
  };
  actions: {
    select: string;
    copy_url: string;
    delete: string;
    cancel: string;
    close: string;
  };
  delete_confirm: {
    title: string;
    description: string;
    in_use_warning: string;
    confirm: string;
    cancel: string;
    permanently: string;
  };
}

interface MediaDetailPaneProps {
  mediaId: string | null;
  dict: MediaDetailDict;
  onClose: () => void;
  onSelect?: (mediaId: string) => void;
  onDelete?: (mediaId: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MediaDetail {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  altText: string | null;
  license: string | null;
  createdAt: string;
  usageCount: number;
  usedIn: Array<{ type: "post" | "page"; id: string; title: string }>;
}

export function MediaDetailPane({
  mediaId,
  dict,
  onClose,
  onSelect,
  onDelete,
}: MediaDetailPaneProps) {
  const [detail, setDetail] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [isZoomed, setIsZoomed] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  const [filenameValue, setFilenameValue] = useState("");
  const [filenameSaving, setFilenameSaving] = useState(false);
  const altDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startEditingFilename = useCallback(() => {
    if (!detail) return;
    const dot = detail.filename.lastIndexOf(".");
    setFilenameValue(dot > 0 ? detail.filename.slice(0, dot) : detail.filename);
    setIsEditingFilename(true);
  }, [detail]);

  const handleFilenameSave = useCallback(async () => {
    if (!detail || !filenameValue.trim()) {
      setIsEditingFilename(false);
      return;
    }
    const dot = detail.filename.lastIndexOf(".");
    const ext = dot > 0 ? detail.filename.slice(dot) : "";
    const newName = filenameValue.trim() + ext;
    if (newName === detail.filename) {
      setIsEditingFilename(false);
      return;
    }
    setFilenameSaving(true);
    const result = await updateMediaAction({ id: detail.id, filename: newName });
    setFilenameSaving(false);
    if (result.success) {
      setIsEditingFilename(false);
      // Re-fetch to update detail state
      const updated = await getMediaAction(detail.id);
      if (updated.success && updated.data) setDetail(updated.data as MediaDetail);
    }
  }, [detail, filenameValue]);

  const handleFilenameCancel = useCallback(() => {
    setIsEditingFilename(false);
  }, []);

  // Fetch details on mount / id change
  useEffect(() => {
    if (!mediaId) return;

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      setDetail(null);

      const result = await getMediaAction(mediaId);
      if (cancelled) return;
      setLoading(false);

      if (result.success && result.data) {
        setDetail(result.data);
        setAltText(result.data.altText || "");
      } else {
        setError(result.error || "Greška pri učitavanju detalja.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  // Debounced alt text save
  const handleAltTextChange = useCallback(
    (value: string) => {
      setAltText(value);

      if (altDebounceRef.current) {
        clearTimeout(altDebounceRef.current);
      }

      altDebounceRef.current = setTimeout(async () => {
        if (!mediaId) return;
        const result = await updateMediaAction({ id: mediaId, altText: value });
        if (!result.success) {
          toast.error(result.error || "Greška pri čuvanju alt teksta.");
        }
      }, 1000);
    },
    [mediaId],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (altDebounceRef.current) {
        clearTimeout(altDebounceRef.current);
      }
    };
  }, []);

  // Copy URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    if (!detail?.url) return;
    try {
      await navigator.clipboard.writeText(detail.url);
      toast.success("URL kopiran u clipboard.");
    } catch {
      toast.error("Greška pri kopiranju URL-a.");
    }
  }, [detail]);

  // Handle delete
  const handleDeleted = useCallback(() => {
    setDeleteDialogOpen(false);
    onDelete?.(mediaId!);
    onClose();
  }, [mediaId, onDelete, onClose]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full flex-col gap-4 p-4">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    );
  }

  // Error state
  if (error || !detail) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
        <Icon name="error" className="text-destructive size-8" />
        <p className="text-muted-foreground text-sm">{error || "Medija nije pronađena."}</p>
        <Button variant="outline" size="sm" onClick={onClose}>
          <Icon name="close" />
          {dict.actions.close}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-foreground text-sm font-medium">{dict.details.title}</h3>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={dict.details.close}>
            <Icon name="close" />
          </Button>
        </div>

        <Separator />

        {/* Preview image */}
        <div className="bg-muted/30 relative overflow-hidden rounded-lg border">
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className={cn(
              "w-full cursor-zoom-in transition-transform",
              isZoomed && "scale-150 cursor-zoom-out",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detail.url}
              alt={detail.altText || detail.filename}
              className="h-auto w-full object-contain"
              draggable={false}
            />
          </button>
        </div>

        {/* Filename — editable, extension preserved */}
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
            {dict.details.name}
          </span>
          {isEditingFilename ? (
            <div className="flex items-center gap-1">
              <Input
                type="text"
                value={filenameValue}
                onChange={(e) => setFilenameValue(e.target.value)}
                onBlur={handleFilenameSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFilenameSave();
                  if (e.key === "Escape") handleFilenameCancel();
                }}
                className="bg-muted/30 h-7 flex-1 px-2"
                autoFocus
                disabled={filenameSaving}
              />
              <span className="text-muted-foreground shrink-0 text-sm">
                {(() => {
                  if (!detail) return "";
                  const dot = detail.filename.lastIndexOf(".");
                  return dot > 0 ? detail.filename.slice(dot) : "";
                })()}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditingFilename}
              className="text-foreground hover:bg-muted/30 group -mx-1 flex items-center gap-1.5 truncate rounded px-1 text-sm font-medium transition-colors"
              title="Kliknite za izmenu naziva"
            >
              {detail &&
                (() => {
                  const dot = detail.filename.lastIndexOf(".");
                  const b = dot > 0 ? detail.filename.slice(0, dot) : detail.filename;
                  return <span className="truncate">{b}</span>;
                })()}
              <span className="text-muted-foreground shrink-0">
                {detail &&
                  (() => {
                    const dot = detail.filename.lastIndexOf(".");
                    return dot > 0 ? detail.filename.slice(dot) : "";
                  })()}
              </span>
              <Icon
                name="edit"
                className="text-muted-foreground/40 group-hover:text-muted-foreground size-3 shrink-0 transition-colors"
              />
            </button>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
              {dict.details.size}
            </span>
            <span className="text-foreground text-xs">{formatSize(detail.size)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
              {dict.details.type}
            </span>
            <Badge variant="outline" className="w-fit text-[10px]">
              {detail.mimeType}
            </Badge>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
              {dict.details.uploaded_at}
            </span>
            <span className="text-foreground text-xs">{formatDate(detail.createdAt)}</span>
          </div>
        </div>

        {/* License */}
        <div className="flex flex-col gap-1.5">
          <label className="text-muted-foreground text-[10px] tracking-wider uppercase">
            Licenca
          </label>
          <select
            value={detail.license || ""}
            onChange={async (e) => {
              const newLicense = e.target.value || null;
              setDetail((prev) => (prev ? { ...prev, license: newLicense } : prev));
              await updateMediaAction({ id: detail.id, license: newLicense || undefined });
            }}
            className="border-input bg-background ring-offset-background file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-8 w-full rounded-md border px-2 text-xs file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Bez licence</option>
            <option value="CC0">CC0 — Javno vlasništvo</option>
            <option value="CC-BY">CC BY — Uz navođenje autora</option>
            <option value="CC-BY-SA">CC BY-SA — Deli pod istim uslovima</option>
            <option value="CC-BY-NC">CC BY-NC — Nekomercijalno</option>
            <option value="CC-BY-ND">CC BY-ND — Bez prerade</option>
            <option value="All Rights Reserved">Sva prava zadržana</option>
            <option value="Royalty Free">Royalty Free</option>
          </select>
        </div>

        <Separator />

        {/* Alt text */}
        <div className="flex flex-col gap-1.5">
          <label className="text-muted-foreground text-[10px] tracking-wider uppercase">
            {dict.details.alt_text}
          </label>
          <Input
            value={altText}
            onChange={(e) => handleAltTextChange(e.target.value)}
            onBlur={() => {
              // Force save on blur
              if (altDebounceRef.current) {
                clearTimeout(altDebounceRef.current);
              }
              if (mediaId) {
                updateMediaAction({ id: mediaId, altText }).catch(() => {});
              }
            }}
            placeholder="Unesite alt tekst..."
            aria-label={dict.details.alt_text}
          />
        </div>

        <Separator />

        {/* Usage count */}
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
            {dict.details.used_in}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {detail.usageCount === 0
                ? "Nije u upotrebi"
                : `${detail.usageCount} ${
                    detail.usageCount === 1 ? dict.details.posts : dict.details.posts
                  } / ${detail.usedIn.filter((r) => r.type === "page").length} ${
                    dict.details.pages
                  }`}
            </Badge>
          </div>
          {detail.usedIn.length > 0 && (
            <ul className="flex max-h-24 flex-col gap-1 overflow-y-auto">
              {detail.usedIn.map((ref) => (
                <li
                  key={`${ref.type}-${ref.id}`}
                  className="text-muted-foreground truncate text-[11px]"
                >
                  <span className="text-muted-foreground/60 text-[10px] tracking-wider uppercase">
                    [{ref.type === "post" ? dict.details.posts : dict.details.pages}]
                  </span>{" "}
                  {ref.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          {/* Action buttons */}
          {onSelect && (
            <Button variant="default" size="default" onClick={() => onSelect(detail.id)}>
              <Icon name="check" />
              {dict.actions.select}
            </Button>
          )}

          <Button variant="outline" size="default" onClick={handleCopyUrl}>
            <Icon name="content_copy" />
            {dict.actions.copy_url}
          </Button>

          <Button
            variant="ghost"
            size="default"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Icon name="delete" />
            {dict.actions.delete}
          </Button>
        </div>
      </div>

      {/* Delete dialog */}
      <MediaDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        mediaId={detail.id}
        mediaUrl={detail.url}
        mediaFilename={detail.filename}
        dict={dict.delete_confirm}
        onDeleted={handleDeleted}
      />
    </>
  );
}
