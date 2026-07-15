"use client";

import { Icon } from "@/components/ui/Icon";
import { useRouter } from "next/navigation";
import { useState, useTransition, useMemo, useEffect, useRef, useCallback } from "react";
import { FacilityMedia } from "@prisma/client";
import {
  uploadMediaAction,
  deleteMediaAction,
  updateMediaOrderAction,
  syncMediaAction,
  toggleMediaHeroAction,
  toggleMediaCardBackgroundAction,
  toggleMediaGalleryVisibilityAction,
  bulkUpdateMediaCaptionAction,
  renameMediaAction,
} from "@/app/(server)/actions/media-actions";
import { bulkDeleteMediaAction } from "@/app/(server)/actions/media-bulk-delete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { upload } from "@vercel/blob/client";
import { cn } from "@/lib/utils";

interface MediaGalleryProps {
  facilityId: string;
  initialMedia: FacilityMedia[];
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

/**
 * 📐 HTML5 Hardware-Native Client-Side Optimization for Large Images
 * Downscales images to max 2000px on the longest side and converts them to high-density WebP
 * before upload, preventing Vercel's strict 4.5MB serverless payload limit from blocking the request.
 */
import { optimizeImageOnClient } from "@/lib/media/client-image-optimizer";
import { filenameFromBlobUrl, captureVideoFrame } from "./_lib/media-utils";
import { MediaItemCard } from "./media-item-card";
import { SortableMediaItem } from "./sortable-media-item";
import { CropModal } from "./crop-modal";
import { MediaUploadDropzone } from "./media-upload-dropzone";
import { MediaFilterBar, type MediaFilterId } from "./media-filter-bar";
import { MAX_FILE_SIZE } from "@/lib/constants";

export function MediaGallery({
  facilityId,
  initialMedia,
  currentPage = 1,
  totalPages = 1,
  totalCount,
}: MediaGalleryProps) {
  const router = useRouter();
  const [media, setMedia] = useState(initialMedia);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);

  // Curation state — declared before filteredMedia memo
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "ALL" | "PHOTOS" | "VIDEOS" | "HERO" | "CARDBG" | "PUBLIC" | "HIDDEN" | "MISSING_ALT"
  >("ALL");
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [croppingMedia, setCroppingMedia] = useState<{ id: string; url: string } | null>(null);
  const [renamingMedia, setRenamingMedia] = useState<{ id: string; url: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [focalPointMediaId, setFocalPointMediaId] = useState<string | null>(null);
  const [bulkCaptionText, setBulkCaptionText] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      // Search matches caption or filename
      const matchesSearch =
        searchQuery === "" ||
        (item.caption && item.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.url.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category filters
      switch (activeFilter) {
        case "PHOTOS":
          return item.type === "PHOTO";
        case "VIDEOS":
          return item.type === "VIDEO";
        case "HERO":
          return item.isHero;
        case "CARDBG":
          return item.isCardBackground;
        case "PUBLIC":
          return item.isGalleryVisible;
        case "HIDDEN":
          return !item.isGalleryVisible;
        case "MISSING_ALT":
          return item.type === "PHOTO" && (!item.caption || item.caption.trim() === "");
        default:
          return true;
      }
    });
  }, [media, searchQuery, activeFilter]);

  const mediaIds = useMemo(() => filteredMedia.map((m) => m.id), [filteredMedia]);
  const activeItem = useMemo(() => media.find((m) => m.id === activeId), [media, activeId]);

  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(media.map((m) => m.id)));
  }, [media]);

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    setShowBulkDeleteDialog(false);
    const idsToDelete = Array.from(selectedIds);

    // Snapshot items for rollback in case of failure
    const deletedItems = media.filter((m) => selectedIds.has(m.id));

    // Optimistic removal
    setMedia((prev) => prev.filter((m) => !selectedIds.has(m.id)));
    setSelectedIds(new Set());
    setIsSelectionMode(false);

    startUpload(async () => {
      const result = await bulkDeleteMediaAction(facilityId, idsToDelete);
      if (result.success) {
        toast.success(
          `Obrisano ${result.deletedCount} medijskih stavki` +
            (result.failedCount && result.failedCount > 0
              ? ` (${result.failedCount} fajlova nije obrisano iz skladišta)`
              : ""),
        );
      } else {
        // Rollback on failure
        setMedia((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const toRestore = deletedItems.filter((m) => !existingIds.has(m.id));
          if (toRestore.length === 0) return prev;
          return [...prev, ...toRestore].sort((a, b) => (a.order || 0) - (b.order || 0));
        });
        toast.error(result.error || "Greška pri grupnom brisanju medija");
      }
    });
  };

  const [isDragActive, setIsDragActive] = useState(false);
  const dragCounterRef = useRef(0);
  const [uploadingFiles, setUploadingFiles] = useState<
    { name: string; type: string; status: "uploading" | "failed" | "done"; errorMessage?: string }[]
  >([]);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const markDone = useCallback((fileName: string) => {
    setUploadingFiles((prev) =>
      prev.map((f) => (f.name === fileName ? { ...f, status: "done" as const } : f)),
    );
    setTimeout(() => {
      setUploadingFiles((prev) => prev.filter((f) => f.name !== fileName));
    }, 2000);
  }, []);

  const markFailed = useCallback((fileName: string, errorMessage: string) => {
    setUploadingFiles((prev) =>
      prev.map((f) =>
        f.name === fileName ? { ...f, status: "failed" as const, errorMessage } : f,
      ),
    );
  }, []);

  const cancelUpload = useCallback((fileName: string) => {
    abortControllersRef.current.get(fileName)?.abort();
  }, []);

  const retryUpload = useCallback(async (fileName: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.name !== fileName));
    toast.info(`Please re-select "${fileName}" to retry`);
  }, []);

  const processFilesUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // Client-side file size validation
      const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        toast.error(`Preveliki fajlovi: ${oversized.map((f) => f.name).join(", ")} (maks 25MB)`);
        return;
      }

      const fileEntries = files.map((f) => ({
        name: f.name,
        type: f.type,
        status: "uploading" as const,
      }));
      setUploadingFiles((prev) => [...prev, ...fileEntries]);

      // Create AbortControllers for these files
      for (const file of files) {
        abortControllersRef.current.set(file.name, new AbortController());
      }

      startUpload(async () => {
        for (const file of files) {
          const abortController = abortControllersRef.current.get(file.name);
          if (abortController?.signal.aborted) {
            markFailed(file.name, "Upload cancelled");
            continue;
          }

          const isVideo = file.type.startsWith("video/");

          try {
            if (isVideo) {
              const thumbBlob = await captureVideoFrame(file);
              let thumbUrl: string | null = null;
              if (thumbBlob) {
                const thumbFile = new File([thumbBlob], `thumb-${file.name}.webp`, {
                  type: "image/webp",
                });
                const thumbResult = await upload(
                  `facilities/${facilityId}/videos/thumbnails/thumb-${Date.now()}.webp`,
                  thumbFile,
                  {
                    access: "public",
                    handleUploadUrl: "/api/upload",
                    clientPayload: JSON.stringify({ facilityId }),
                  },
                );
                thumbUrl = thumbResult.url;
              }

              const blob = await upload(`facilities/${facilityId}/videos/${file.name}`, file, {
                access: "public",
                handleUploadUrl: "/api/upload",
                clientPayload: JSON.stringify({ facilityId }),
                onUploadProgress: (progress) => {
                  setUploadProgress((prev) => ({ ...prev, [file.name]: progress.percentage }));
                },
              });

              const syncResult = await syncMediaAction(facilityId, blob.url, file.type, thumbUrl);

              if (syncResult.success && "media" in syncResult) {
                setMedia((prev) => [...prev, syncResult.media as FacilityMedia]);
                markDone(file.name);
              } else {
                const msg =
                  ("error" in syncResult ? syncResult.error : null) ||
                  `Sync failed for ${file.name}`;
                markFailed(file.name, msg);
              }
            } else {
              const optimizedBlob = await optimizeImageOnClient(file, {
                mode: "fit",
                maxWidth: 2000,
                maxHeight: 2000,
                quality: 0.85,
              }).catch(() => file);

              if (abortController?.signal.aborted) {
                markFailed(file.name, "Upload cancelled");
                continue;
              }

              const optimizedFile =
                optimizedBlob instanceof File
                  ? optimizedBlob
                  : new File([optimizedBlob], file.name.replace(/\\.[^.]+$/, ".webp"), {
                      type: "image/webp",
                    });

              const formData = new FormData();
              formData.append("facilityId", facilityId);
              formData.append("files", optimizedFile);

              const result = await uploadMediaAction(formData);
              if (result.success && "media" in result) {
                setMedia((prev) => [...prev, ...(result.media as FacilityMedia[])]);
                markDone(file.name);
              } else {
                const msg =
                  ("error" in result ? result.error : null) || `Upload failed for ${file.name}`;
                markFailed(file.name, msg);
              }
            }
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
              markFailed(file.name, "Upload cancelled");
            } else {
              const msg = error instanceof Error ? error.message : "Unknown upload error";
              markFailed(file.name, msg);
            }
          } finally {
            abortControllersRef.current.delete(file.name);
            setUploadProgress((prev) => {
              const next = { ...prev };
              delete next[file.name];
              return next;
            });
          }
        }
      });
    },
    [facilityId, startUpload, markDone, markFailed],
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFilesUpload(files);
    e.target.value = "";
  };

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes("Files")) {
        dragCounterRef.current++;
        setIsDragActive(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes("Files")) {
        dragCounterRef.current--;
        if (dragCounterRef.current <= 0) {
          dragCounterRef.current = 0;
          setIsDragActive(false);
        }
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      dragCounterRef.current = 0;

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        await processFilesUpload(files);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [processFilesUpload]);

  useEffect(() => {
    if (!isSelectionMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard to prevent firing while typing Alt tags inside the input fields
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === "a") {
        e.preventDefault();
        handleSelectAll();
        toast.info("Selected all media assets");
      } else if (key === "d") {
        e.preventDefault();
        handleDeselectAll();
        toast.info("Deselected all media assets");
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsSelectionMode(false);
        setSelectedIds(new Set());
        toast.info("Exited curation selection mode");
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size > 0) {
        e.preventDefault();
        handleBulkDelete();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSelectionMode, selectedIds, handleSelectAll, media]);

  const handleDelete = async (id: string) => {
    const itemToDelete = media.find((m) => m.id === id);
    if (!itemToDelete) return;

    setMedia((prev) => prev.filter((m) => m.id !== id));

    const result = await deleteMediaAction(id, facilityId);

    if (result.success) {
      toast.success("Media deleted");
    } else {
      setMedia((prev) => {
        const next = [...prev, itemToDelete];
        return next.sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      toast.error(result.error || "Delete failed");
    }
  };

  // ─── Rename handler ─────────────────────────────────────────────────────────
  const handleOpenRename = useCallback((id: string, url: string) => {
    const name = filenameFromBlobUrl(url);
    setRenameValue(name);
    setRenamingMedia({ id, url });
  }, []);

  const handleRename = useCallback(async () => {
    if (!renamingMedia || !renameValue.trim()) return;
    try {
      const result = (await renameMediaAction(
        renamingMedia.id,
        facilityId,
        renameValue.trim(),
      )) as { success: boolean; media?: FacilityMedia; error?: string };
      if (result.success && result.media) {
        setMedia((prev) => prev.map((m) => (m.id === renamingMedia.id ? result.media! : m)));
        toast.success("Ime fajla je uspešno promenjeno!");
        setRenamingMedia(null);
        setRenameValue("");
      } else {
        toast.error(result.error || "Greška pri promeni imena");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška pri promeni imena");
    }
  }, [renamingMedia, renameValue, facilityId]);

  const handleToggleHero = async (id: string) => {
    // Capture current state inside a ref to avoid stale closure on rollback
    const prevItem = media.find((m) => m.id === id);
    const wasHero = prevItem?.isHero ?? false;

    // Optimistic update: unset other heroes, set this one
    setMedia((prev) =>
      prev.map((m) => {
        if (m.id === id) return { ...m, isHero: !wasHero };
        if (!wasHero) return { ...m, isHero: false };
        return m;
      }),
    );

    const result = await toggleMediaHeroAction(id, facilityId);
    if (!result.success) {
      setMedia((prev) =>
        prev.map((m) => {
          if (m.id === id) return { ...m, isHero: wasHero };
          if (!wasHero) return { ...m, isHero: false };
          return m;
        }),
      );
      toast.error("Failed to update Hero status");
    } else {
      toast.success(wasHero ? "Hero status removed" : "Set as Facility Hero");
    }
  };

  const handleToggleCardBackground = async (id: string) => {
    const prevItem = media.find((m) => m.id === id);
    const wasCardBg = prevItem?.isCardBackground ?? false;

    // Optimistic update
    setMedia((prev) =>
      prev.map((m) => {
        if (m.id === id) return { ...m, isCardBackground: !wasCardBg };
        if (!wasCardBg) return { ...m, isCardBackground: false };
        return m;
      }),
    );

    const result = await toggleMediaCardBackgroundAction(id, facilityId);
    if (!result.success) {
      setMedia((prev) =>
        prev.map((m) => {
          if (m.id === id) return { ...m, isCardBackground: wasCardBg };
          if (!wasCardBg) return { ...m, isCardBackground: false };
          return m;
        }),
      );
      toast.error("Failed to update Card Background");
    } else {
      toast.success(wasCardBg ? "Background removed" : "Set as Card Background");
    }
  };

  const handleToggleVisibility = async (id: string) => {
    const prevItem = media.find((m) => m.id === id);
    if (!prevItem) return;

    setMedia((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isGalleryVisible: !m.isGalleryVisible } : m)),
    );

    const result = await toggleMediaGalleryVisibilityAction(id, facilityId);
    if (!result.success) {
      setMedia((prev) =>
        prev.map((m) => {
          if (m.id === id) return { ...m, isGalleryVisible: prevItem.isGalleryVisible };
          return m;
        }),
      );
      toast.error("Visibility toggle failed");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    setMedia((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const nextItems = arrayMove(items, oldIndex, newIndex);

      startUpload(async () => {
        const res = await updateMediaOrderAction(
          facilityId,
          nextItems.map((i) => i.id),
        );
        if (!res.success) {
          toast.error("Failed to save reorder");
        }
      });

      return nextItems;
    });
  };

  useEffect(() => {
    if (hasUnsavedEdits) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
      };
      window.addEventListener("beforeunload", handler);
      return () => window.removeEventListener("beforeunload", handler);
    }
  }, [hasUnsavedEdits]);

  return (
    <div className="space-y-8">
      {/* 🌌 High-fidelity Glassmorphic Full-Screen Drag Overlay */}
      {isDragActive && (
        <div className="bg-background/80 animate-in fade-in pointer-events-none fixed inset-0 z-[999] flex flex-col items-center justify-center text-center backdrop-blur-xl duration-300">
          <div className="bg-muted/10 border-primary/30 animate-in zoom-in-95 mx-4 flex max-w-md flex-col items-center rounded-3xl border p-12 shadow-[0_0_50px_hsl(var(--primary)/0.15)] duration-500">
            <div className="bg-primary/10 border-primary/20 mb-8 animate-bounce rounded-3xl border p-6">
              <Icon name="upload" className="text-primary h-16 w-16" />
            </div>
            <h3 className="text-foreground mb-3 text-2xl font-black tracking-tighter uppercase">
              Spusti datoteke za otpremanje
            </h3>
            <p className="text-primary mb-1 text-xs leading-relaxed font-semibold tracking-widest uppercase">
              Splash Engine: High-Bandwidth Protocol
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed font-medium tracking-widest uppercase">
              Asset Optimization active. Drop anywhere to start bulk curation.
            </p>
          </div>
        </div>
      )}

      {/* 🛠️ Action Toolbar */}
      <div className="bg-background/60 border-border/50 sticky top-0 z-40 -mx-4 flex items-center justify-between gap-4 border-b p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/facilities/${facilityId}`)}
            className="h-9 w-9 rounded-xl p-0"
            aria-label="Nazad na objekat"
          >
            <Icon name="keyboard_arrow_left" className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              setSelectedIds(new Set());
            }}
            className={cn(
              "h-9 gap-2 px-4 text-[10px] font-black tracking-widest uppercase transition-colors",
              isSelectionMode
                ? "bg-primary/20 border-primary text-primary"
                : "bg-muted/30 border-border/50",
            )}
          >
            {isSelectionMode ? (
              <Icon name="close" className="size-3" />
            ) : (
              <Icon name="edit" className="size-3" />
            )}
            {isSelectionMode ? "Exit Curation" : "Selection Mode"}
          </Button>

          {isSelectionMode && (
            <div className="animate-in slide-in-from-left-2 flex items-center gap-2 duration-300">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="bg-muted/30 border-border/50 hover:bg-muted/50 h-9 border px-3 text-[10px] font-black tracking-widest uppercase"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                className="bg-muted/30 border-border/50 hover:bg-muted/50 h-9 border px-3 text-[10px] font-black tracking-widest uppercase"
              >
                Deselect All
              </Button>
              {selectedIds.size > 0 && (
                <>
                  <div className="bg-muted/50 mx-2 h-4 w-[1px]" />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="mr-2 h-9 gap-2 px-4 text-[10px] font-black tracking-widest uppercase"
                  >
                    <Icon name="delete" className="size-3" />
                    Delete {selectedIds.size} Assets
                  </Button>

                  <div className="bg-muted/50 mx-2 h-4 w-[1px]" />

                  <div className="border-border/50 animate-in fade-in flex items-center gap-1.5 rounded-lg border bg-black/40 px-2 py-0.5 duration-300">
                    <Input
                      type="text"
                      placeholder="Bulk Alt tag..."
                      aria-label="Bulk caption"
                      value={bulkCaptionText}
                      onChange={(e) => setBulkCaptionText(e.target.value)}
                      className="text-foreground placeholder:text-muted-foreground/80 w-32 bg-transparent px-1 text-[10px] focus:outline-none"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const val = bulkCaptionText.trim();
                        if (!val) {
                          toast.error("Bulk ALT tag je obavezan");
                          return;
                        }
                        startUpload(async () => {
                          try {
                            const ids = Array.from(selectedIds);
                            const res = await bulkUpdateMediaCaptionAction(ids, facilityId, val);
                            if (res.success) {
                              setMedia((prev) =>
                                prev.map((m) => (ids.includes(m.id) ? { ...m, caption: val } : m)),
                              );
                              setSelectedIds(new Set());
                              setIsSelectionMode(false);
                              setBulkCaptionText("");
                              toast.success(`Bulk ALT ažuriran za ${ids.length} slika`);
                            } else {
                              toast.error("Bulk ALT nije sačuvan");
                            }
                          } catch (err) {
                            console.error(err);
                            toast.error("Greška pri bulk čuvanju");
                          }
                        });
                      }}
                      disabled={isUploading}
                      className="text-primary hover:bg-primary/10 hover:text-primary-foreground h-7 gap-1 px-2 text-[9px] font-black tracking-widest uppercase"
                    >
                      <Icon name="check" className="size-3" />
                      Apply
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground mr-2 text-[10px] font-black tracking-widest uppercase">
            {media.length} medija
          </span>
        </div>
      </div>

      {/* Filter */}
      <MediaFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter as MediaFilterId}
        onFilterChange={(v) => setActiveFilter(v)}
      />

      {/* Upload Zone */}
      {!isSelectionMode && (
        <MediaUploadDropzone
          isEmpty={media.length === 0}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          onUpload={handleUpload}
        />
      )}

      {/* Media Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={mediaIds} strategy={rectSortingStrategy}>
          <div
            className="animate-in fade-in grid grid-cols-1 gap-6 duration-500 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            role="listbox"
            aria-label="Stavke medija"
          >
            {filteredMedia.map((item) => (
              <SortableMediaItem
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                isSelectionMode={isSelectionMode}
                onSelect={() => toggleSelection(item.id)}
                onDelete={() => handleDelete(item.id)}
                onToggleHero={() => handleToggleHero(item.id)}
                onToggleCardBG={() => handleToggleCardBackground(item.id)}
                onToggleVisibility={() => handleToggleVisibility(item.id)}
                focalPointMediaId={focalPointMediaId}
                onToggleFocalPoint={() =>
                  setFocalPointMediaId(focalPointMediaId === item.id ? null : item.id)
                }
                onCrop={() => setCroppingMedia({ id: item.id, url: item.url })}
                onFocalPointSaved={(id, coords) =>
                  setMedia((prev) =>
                    prev.map((m) => (m.id === id ? { ...m, focalPoint: coords } : m)),
                  )
                }
                onUnsavedEdit={setHasUnsavedEdits}
                onRename={() => handleOpenRename(item.id, item.url)}
              />
            ))}

            {/* Skeletons for assets currently in transit */}
            {uploadingFiles.map((file, idx) => (
              <div
                key={`transiting-${idx}-${file.name}`}
                className={cn(
                  "relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-2xl border p-4",
                  file.status === "failed"
                    ? "border-destructive/40 bg-destructive/20"
                    : file.status === "done"
                      ? "border-primary/40 bg-primary/20"
                      : "bg-muted/40 border-primary/20 animate-pulse shadow-[0_0_20px_hsl(var(--primary)/0.05)]",
                )}
              >
                {file.status === "failed" ? (
                  <Icon name="error" className="text-destructive mb-2 text-[24px]" />
                ) : file.status === "done" ? (
                  <Icon name="check_circle" className="text-primary mb-2 text-[24px]" />
                ) : (
                  <Icon
                    name="progress_activity"
                    className="text-primary mb-2 animate-spin text-[24px]"
                  />
                )}
                <span className="text-muted-foreground max-w-full truncate px-2 text-[10px] font-black tracking-wider uppercase">
                  {file.name}
                </span>
                <span
                  className={cn(
                    "mt-1 text-[8px] font-bold tracking-widest uppercase",
                    file.status === "failed"
                      ? "text-destructive"
                      : file.status === "done"
                        ? "text-primary"
                        : "text-primary",
                  )}
                >
                  {file.status === "failed"
                    ? file.errorMessage || "Upload failed"
                    : file.status === "done"
                      ? "Uploaded"
                      : uploadProgress[file.name] !== undefined
                        ? `Uploading ${uploadProgress[file.name].toFixed(0)}%`
                        : "Optimizing..."}
                </span>
                {file.status === "uploading" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelUpload(file.name);
                    }}
                    className="hover:bg-destructive/80 absolute top-2 right-2 z-40 size-6 rounded-md bg-black/60 text-white/70 transition-colors hover:text-white"
                    aria-label={`Cancel upload: ${file.name}`}
                  >
                    <Icon name="close" className="size-3.5" />
                  </Button>
                )}
                {file.status === "failed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      retryUpload(file.name);
                    }}
                    className="hover:bg-primary/80 absolute top-2 right-2 z-40 size-6 rounded-md bg-black/60 text-white/70 transition-colors hover:text-white"
                    aria-label={`Retry upload: ${file.name}`}
                  >
                    <Icon name="refresh" className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </SortableContext>

        <DragOverlay adjustScale={true} dropAnimation={dropAnimation}>
          {activeId && activeItem ? (
            <div className="z-50 scale-105 cursor-grabbing transition-transform duration-300">
              <MediaItemCard item={activeItem} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 📄 Pagination */}
      {totalPages > 1 && (
        <div className="border-border/50 mt-8 flex items-center justify-between gap-4 border-t py-4">
          <div className="text-muted-foreground text-[11px] font-medium">
            {totalCount !== undefined && `${totalCount} assets total`}
            {totalCount !== undefined &&
              totalPages > 1 &&
              ` · Page ${currentPage} of ${totalPages}`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("page", String(currentPage - 1));
                router.push(`?${params.toString()}`);
              }}
              className="h-8 px-3 text-[10px] font-black tracking-widest uppercase"
            >
              <Icon name="keyboard_arrow_left" className="mr-1 size-3.5" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                // Show window around current page
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.set("page", String(pageNum));
                      router.push(`?${params.toString()}`);
                    }}
                    className={cn(
                      "h-8 w-8 p-0 text-[10px] font-black",
                      pageNum === currentPage && "border-primary bg-primary/20 text-primary",
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("page", String(currentPage + 1));
                router.push(`?${params.toString()}`);
              }}
              className="h-8 px-3 text-[10px] font-black tracking-widest uppercase"
            >
              Next
              <Icon name="keyboard_arrow_right" className="ml-1 size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Brisanje medija</DialogTitle>
            <DialogDescription>
              Da li ste sigurni da želite da obrišete {selectedIds.size} medijskih stavki? Ova
              radnja se ne može poništiti.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
              Otkaži
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>
              Obriši
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✂️ High-Fidelity Canvas Image Cropper Modal */}
      {croppingMedia && (
        <CropModal
          media={croppingMedia}
          onClose={() => setCroppingMedia(null)}
          onSave={async (file: File) => {
            await processFilesUpload([file]);
            setCroppingMedia(null);
          }}
        />
      )}

      {/* ✏️ Rename File Dialog */}
      <Dialog
        open={!!renamingMedia}
        onOpenChange={(open) => {
          if (!open) {
            setRenamingMedia(null);
            setRenameValue("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Preimenuj fajl</DialogTitle>
            <DialogDescription>
              Promenite naziv fajla na blob storage-u. Ekstenzija ostaje nepromenjena.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Label
              htmlFor="media-rename-input"
              className="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
            >
              Naziv fajla
            </Label>
            <div className="flex items-center gap-0">
              <Input
                id="media-rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="unesite naziv"
                className="rounded-r-none font-mono text-sm focus-visible:z-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && renameValue.trim()) {
                    e.preventDefault();
                    handleRename();
                  }
                }}
                autoFocus
              />
              <div className="border-input bg-muted/30 text-muted-foreground flex h-10 items-center rounded-r-md border border-l-0 px-3 font-mono text-xs select-none">
                .
                {renamingMedia
                  ? renamingMedia.url.split("?")[0].split(".").pop()?.toLowerCase() || "webp"
                  : "webp"}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRenamingMedia(null);
                setRenameValue("");
              }}
            >
              Otkaži
            </Button>
            <Button type="button" onClick={handleRename} disabled={!renameValue.trim()}>
              Sačuvaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
