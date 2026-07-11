"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { uploadMediaAction, uploadMediaFromUrlAction } from "@/app/(server)/actions/cms-media";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";
import { MediaUploadProgress, type UploadItem } from "./media-upload-progress";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

interface MediaTypeDict {
  upload_progress: {
    uploading: string;
    done: string;
    error: string;
    file_too_large: string;
    invalid_format: string;
  };
  empty: {
    title: string;
    description: string;
    formats_hint: string;
    size_hint: string;
  };
  upload: string;
  paste_url: string;
  paste_url_placeholder: string;
  paste_url_button: string;
  duplicate_warning: string;
  duplicate_upload_anyway: string;
  duplicate_cancel: string;
  actions: {
    select: string;
    insert: string;
    delete: string;
    permanent_delete: string;
    delete_selected: string;
    copy_url: string;
    copy_urls: string;
    cancel: string;
    close: string;
    retry: string;
    undo: string;
  };
}

interface MediaUploadZoneProps {
  dict: MediaTypeDict;
  onUploadComplete?: (media: { id: string; url: string }) => void;
}

// ─── Helpers ────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function fileToWebPBlob(file: File): Promise<Blob | null> {
  try {
    const img = new Image();
    const bitmap = await createImageBitmap(file, {
      resizeQuality: "high",
    });

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(null);
          }
        },
        "image/webp",
        0.85,
      );
    });
  } catch {
    return null;
  }
}

// ─── Component ──────────────────────────────────────────────

export function MediaUploadZone({ dict, onUploadComplete }: MediaUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [urlValue, setUrlValue] = useState("");
  const [isImportingUrl, setIsImportingUrl] = useState(false);

  // Duplicate dialog state
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    file: File;
    webpBlob: Blob | null;
  }>({ open: false, file: null as unknown as File, webpBlob: null });

  // ─── Upload logic ─────────────────────────────────────────

  const doUpload = useCallback(
    async (file: File, blobOverride: Blob | null) => {
      const uploadId = generateId();

      // Client-side validation
      if (file.size > MAX_FILE_SIZE) {
        setUploads((prev) => [
          ...prev,
          {
            id: uploadId,
            filename: file.name,
            progress: 0,
            size: file.size,
            status: "error",
            error: dict.upload_progress.file_too_large,
          },
        ]);
        toast.error(dict.upload_progress.file_too_large);
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        setUploads((prev) => [
          ...prev,
          {
            id: uploadId,
            filename: file.name,
            progress: 0,
            size: file.size,
            status: "error",
            error: dict.upload_progress.invalid_format,
          },
        ]);
        toast.error(dict.upload_progress.invalid_format);
        return;
      }

      setUploads((prev) => [
        ...prev,
        {
          id: uploadId,
          filename: file.name,
          progress: 0,
          size: file.size,
          status: "uploading",
        },
      ]);

      try {
        // Try canvas WebP conversion first
        const webpBlob =
          blobOverride ||
          (file.type === "image/gif" || file.type === "image/svg+xml"
            ? null
            : await fileToWebPBlob(file));

        const uploadFile = webpBlob
          ? new File([webpBlob], file.name.replace(/\.[^.]+$/, ".webp"), {
              type: "image/webp",
            })
          : file;

        const formData = new FormData();
        formData.append("file", uploadFile);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId ? { ...u, progress: Math.min(u.progress + 15, 90) } : u,
            ),
          );
        }, 200);

        const result = await uploadMediaAction(formData);
        clearInterval(progressInterval);

        if (result.success && result.data) {
          setUploads((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: 100, status: "done" } : u)),
          );

          const rw = result as any;
          toast.success(
            rw.warning
              ? `${file.name} — ${rw.warning}`
              : `${file.name} — ${dict.upload_progress.done}`,
          );

          if (rw.warning) {
            // Show duplicate dialog
            setDuplicateDialog({ open: true, file, webpBlob });
          }

          onUploadComplete?.(result.data);
        } else {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId
                ? { ...u, status: "error", error: result.error || "Nepoznata greška" }
                : u,
            ),
          );
          toast.error(result.error || dict.upload_progress.error);
        }
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? {
                  ...u,
                  status: "error",
                  error: err instanceof Error ? err.message : "Nepoznata greška",
                }
              : u,
          ),
        );
        toast.error(dict.upload_progress.error);
      }
    },
    [dict, onUploadComplete],
  );

  // ─── Drag & Drop handlers ─────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files).filter((f) => ALLOWED_TYPES.includes(f.type));

      for (const file of files) {
        doUpload(file, null);
      }
    },
    [doUpload],
  );

  // ─── File Input handler ───────────────────────────────────

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        doUpload(file, null);
      }
      // Reset so re-selecting the same file works
      e.target.value = "";
    },
    [doUpload],
  );

  // ─── URL Import handler ───────────────────────────────────

  const handleUrlImport = useCallback(async () => {
    if (!urlValue.trim()) return;

    setIsImportingUrl(true);
    try {
      const result = await uploadMediaFromUrlAction(urlValue.trim());
      if (result.success && result.data) {
        toast.success(dict.upload_progress.done);
        onUploadComplete?.(result.data);
        setUrlValue("");
      } else {
        toast.error(result.error || dict.upload_progress.error);
      }
    } catch {
      toast.error(dict.upload_progress.error);
    } finally {
      setIsImportingUrl(false);
    }
  }, [urlValue, dict, onUploadComplete]);

  // ─── Duplicate dialog handlers ────────────────────────────

  const handleDuplicateConfirm = useCallback(() => {
    setDuplicateDialog((prev) => {
      if (prev.file) {
        doUpload(prev.file, prev.webpBlob);
      }
      return { ...prev, open: false };
    });
  }, [doUpload]);

  const handleDuplicateCancel = useCallback(() => {
    setDuplicateDialog({ open: false, file: null as unknown as File, webpBlob: null });
  }, []);

  // ─── Render ───────────────────────────────────────────────

  return (
    <>
      {/* Upload progress overlay */}
      <MediaUploadProgress uploads={uploads} />

      {/* Drag & drop zone */}
      <div className="flex flex-col gap-4">
        <div
          role="button"
          tabIndex={0}
          aria-label={dict.upload}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition",
            isDragOver
              ? "border-primary/50 bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/40",
          )}
        >
          <Icon name="upload" className="text-muted-foreground/60 size-8" />
          <div className="flex flex-col gap-1">
            <p className="text-foreground text-sm font-medium">{dict.empty.description}</p>
            <p className="text-muted-foreground text-xs">{dict.empty.formats_hint}</p>
            <p className="text-muted-foreground text-xs">{dict.empty.size_hint}</p>
          </div>
          <Button variant="outline" size="sm" type="button">
            <Icon name="add" />
            {dict.upload}
          </Button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Paste URL section */}
        <div className="flex items-center gap-2">
          <Separator className="flex-1 shrink-0" />
          <span className="text-muted-foreground shrink-0 text-[10px] tracking-wider uppercase">
            {dict.paste_url}
          </span>
          <Separator className="flex-1 shrink-0" />
        </div>

        <div className="flex gap-2">
          <Input
            type="url"
            placeholder={dict.paste_url_placeholder}
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUrlImport();
            }}
            aria-label={dict.paste_url}
          />
          <Button
            variant="outline"
            size="default"
            onClick={handleUrlImport}
            disabled={isImportingUrl || !urlValue.trim()}
          >
            {isImportingUrl ? (
              <Icon name="progress_activity" className="size-4 animate-spin" />
            ) : (
              <Icon name="download" />
            )}
            {dict.paste_url_button}
          </Button>
        </div>
      </div>

      {/* Duplicate upload dialog */}
      <AlertDialog
        open={duplicateDialog.open}
        onOpenChange={(open) => {
          if (!open) handleDuplicateCancel();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dict.duplicate_warning}</AlertDialogTitle>
            <AlertDialogDescription>
              {dict.duplicate_warning.replace("{filename}", duplicateDialog.file?.name || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel onClick={handleDuplicateCancel}>
              {dict.duplicate_cancel}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDuplicateConfirm}>
              {dict.duplicate_upload_anyway}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
