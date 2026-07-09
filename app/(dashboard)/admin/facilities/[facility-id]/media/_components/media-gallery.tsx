"use client";

import { Icon } from "@/components/ui/Icon";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
  updateMediaCaptionAction,
  updateMediaFocalPointAction,
  bulkUpdateMediaCaptionAction,
  renameMediaAction,
} from "@/server/actions/media-actions";
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
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { MediaItemCard } from "./media-item-card";
import { SortableMediaItem } from "./sortable-media-item";
import { CropModal } from "./crop-modal";

/**
 * Extracts the display filename (without extension) from a Vercel Blob URL.
 */
function filenameFromBlobUrl(url: string): string {
  try {
    const segments = new URL(url).pathname.split("/");
    const last = segments[segments.length - 1] ?? "fajl";
    return last.replace(/^\d+-/, "").replace(/\.[^.]+$/, "");
  } catch {
    return "fajl";
  }
}

/**
 * Captures the first frame of a video file as a WebP blob.
 * Uses HTMLVideoElement + canvas, zero external dependencies.
 */
async function captureVideoFrame(file: File): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.src = url;

    // Wait for metadata, seek to 0.5s
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(0.5, video.duration || 0.5);
        resolve();
      };
      video.onerror = () => reject(new Error("Video load failed"));
      // Set a timeout in case the video is corrupt
      setTimeout(() => reject(new Error("Video load timeout")), 10000);
    });

    // Wait for seek to complete
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      // If already seeked (0s video), resolve immediately
      if (video.readyState >= 2) resolve();
    });

    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 225; // 16:9
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, 400, 225);
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", 0.7);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function MediaGallery({
  facilityId,
  initialMedia,
  currentPage = 1,
  totalPages = 1,
  totalCount,
}: MediaGalleryProps) {
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
    setMedia((prev) => prev.filter((m) => !selectedIds.has(m.id)));
    setSelectedIds(new Set());
    setIsSelectionMode(false);

    startUpload(async () => {
      for (const id of idsToDelete) {
        await deleteMediaAction(id, facilityId);
      }
      toast.success(`Purged ${idsToDelete.length} assets from node`);
    });
  };

  const [isDragActive, setIsDragActive] = useState(false);
  const dragCounterRef = useRef(0);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; type: string }[]>([]);

  const processFilesUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // Client-side file size validation
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB — matches lib/constants
      const oversized = files.filter((f) => f.size > MAX_SIZE);
      if (oversized.length > 0) {
        toast.error(`Files too large: ${oversized.map((f) => f.name).join(", ")} (max 10MB)`);
        return;
      }

      setUploadingFiles((prev) => [...prev, ...files.map((f) => ({ name: f.name, type: f.type }))]);

      startUpload(async () => {
        for (const file of files) {
          const isVideo = file.type.startsWith("video/");

          try {
            if (isVideo) {
              // Capture thumbnail frame before uploading
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
                toast.success(`Video recorded: ${file.name}`);
              } else {
                toast.error(
                  ("error" in syncResult ? syncResult.error : null) ||
                    `Sync failed for ${file.name}`,
                );
              }
            } else {
              // Pre-process images on the client to avoid hitting the 4.5MB Serverless Function payload size limit
              const optimizedBlob = await optimizeImageOnClient(file, {
                mode: "fit",
                maxWidth: 2000,
                maxHeight: 2000,
                quality: 0.85,
              }).catch(() => file);
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
                toast.success(`Photo uploaded: ${file.name}`);
              } else {
                toast.error(
                  ("error" in result ? result.error : null) || `Failed to optimize ${file.name}`,
                );
              }
            }
          } catch (error) {
            console.error("Upload failed for:", file.name, error);
            toast.error(`Fatal error uploading ${file.name}`);
          } finally {
            setUploadProgress((prev) => {
              const next = { ...prev };
              delete next[file.name];
              return next;
            });
            setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
          }
        }
      });
    },
    [facilityId, startUpload],
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
    const item = media.find((m) => m.id === id);
    if (!item) return;

    // Optimistic update: unset other heroes, set this one
    setMedia((prev) =>
      prev.map((m) => {
        if (m.id === id) return { ...m, isHero: !m.isHero };
        if (!item.isHero) return { ...m, isHero: false }; // If we are making this hero, others must lose it
        return m;
      }),
    );

    const result = await toggleMediaHeroAction(id, facilityId);
    if (!result.success) {
      setMedia((prev) => prev.map((m) => (m.id === id ? item : m))); // Rollback
      toast.error("Failed to update Hero status");
    } else {
      toast.success(item.isHero ? "Hero status removed" : "Set as Facility Hero");
    }
  };

  const handleToggleCardBackground = async (id: string) => {
    const item = media.find((m) => m.id === id);
    if (!item) return;

    // Optimistic update
    setMedia((prev) =>
      prev.map((m) => {
        if (m.id === id) return { ...m, isCardBackground: !m.isCardBackground };
        if (!item.isCardBackground) return { ...m, isCardBackground: false };
        return m;
      }),
    );

    const result = await toggleMediaCardBackgroundAction(id, facilityId);
    if (!result.success) {
      setMedia((prev) => prev.map((m) => (m.id === id ? item : m)));
      toast.error("Failed to update Card Background");
    } else {
      toast.success(item.isCardBackground ? "Background removed" : "Set as Card Background");
    }
  };

  const handleToggleVisibility = async (id: string) => {
    const item = media.find((m) => m.id === id);
    if (!item) return;

    setMedia((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isGalleryVisible: !m.isGalleryVisible } : m)),
    );

    const result = await toggleMediaGalleryVisibilityAction(id, facilityId);
    if (!result.success) {
      setMedia((prev) => prev.map((m) => (m.id === id ? item : m)));
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
          <div className="bg-muted/10 border-primary/30 animate-in zoom-in-95 mx-4 flex max-w-md flex-col items-center rounded-3xl border p-12 shadow-[0_0_50px_rgba(6,182,212,0.15)] duration-500">
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
            variant="outline"
            size="sm"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              setSelectedIds(new Set());
            }}
            className={cn(
              "h-9 gap-2 px-4 text-[10px] font-black tracking-widest uppercase transition-all",
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
                    <input
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
                          toast.error("Typing a bulk Alt tag is required");
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
                              toast.success(`Bulk ALT tag updated for ${ids.length} images`);
                            } else {
                              toast.error("Failed to apply bulk Alt tag");
                            }
                          } catch (err) {
                            console.error(err);
                            toast.error("Bulk save error");
                          }
                        });
                      }}
                      disabled={isUploading}
                      className="h-7 gap-1 px-2 text-[9px] font-black tracking-widest text-cyan-400 uppercase hover:bg-cyan-500/10 hover:text-cyan-300"
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
            {media.length} Registry Objects
          </span>
        </div>
      </div>

      {/* 🔍 Curation Search & Filter Panel */}
      <div className="bg-muted/30 border-border/50 animate-in fade-in flex flex-col justify-between gap-4 rounded-2xl border p-4 duration-300 lg:flex-row lg:items-center">
        {/* Search Input */}
        <div className="relative max-w-md flex-1">
          <Icon
            name="search"
            className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
          />
          <input
            type="text"
            placeholder="Pretraži medije po ALT oznaci ili nazivu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-border/50 text-foreground/90 placeholder:text-muted-foreground/80 focus:border-ring w-full rounded-xl border bg-black/40 py-2 pr-4 pl-10 text-xs font-medium transition-colors focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2 transition-colors"
              aria-label="Clear search"
            >
              <Icon name="close" className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Badges Row */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: "Svi" },
            { id: "PHOTOS", label: "Slike" },
            { id: "VIDEOS", label: "Video" },
            { id: "HERO", label: "Hero" },
            { id: "CARDBG", label: "Kartica BG" },
            { id: "PUBLIC", label: "Javno" },
            { id: "HIDDEN", label: "Skriveno" },
            { id: "MISSING_ALT", label: "⚠️ Bez ALT taga" },
          ].map((filt) => (
            <Button
              key={filt.id}
              variant={activeFilter === filt.id ? "default" : "outline"}
              size="sm"
              type="button"
              onClick={() => setActiveFilter(filt.id as typeof activeFilter)}
              className={cn(
                "h-7 rounded-lg px-3 text-[9px] font-black tracking-widest uppercase transition-all",
                activeFilter === filt.id
                  ? "border border-cyan-500 bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "bg-muted/10 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30 border",
              )}
            >
              {filt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Upload Zone (Integrated Empty State) */}
      {!isSelectionMode && (
        <div
          className={cn(
            "group border-border/50 bg-muted/40 hover:bg-muted/60 hover:border-primary/50 relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center backdrop-blur-md transition-all",
            media.length === 0 && !isUploading ? "py-32" : "py-12",
          )}
        >
          {media.length === 0 && !isUploading ? (
            <div className="animate-in zoom-in-95 flex max-w-sm flex-col items-center duration-500">
              <div className="bg-muted/10 border-border/50 group-hover:bg-primary/5 mb-8 rounded-3xl border p-6 transition-all duration-500 group-hover:scale-110">
                <Icon
                  name="image"
                  className="text-muted-foreground/80 group-hover:text-primary text-[48px] transition-colors"
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-foreground text-xl font-black tracking-tighter uppercase">
                  Media Node Empty
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed font-medium tracking-widest uppercase">
                  The facility gallery is currently void of visual intelligence. Drop assets here to
                  initiate curation.
                </p>
                <p className="text-muted-foreground/60 mt-2 text-[10px]">
                  Click or drag to upload files
                </p>
              </div>
            </div>
          ) : (
            <>
              <Icon
                name="upload"
                className="text-muted-foreground group-hover:text-primary mb-4 text-[48px] transition-colors"
              />
              <div className="space-y-1">
                <p className="text-base font-semibold">Drop your files here, or browse local</p>
                <p className="text-muted-foreground text-sm">
                  Photos and Videos supported. WebP processing active.
                </p>
              </div>
            </>
          )}

          <label htmlFor="media-upload" className="sr-only">
            Select photos or videos to upload
          </label>
          <input
            id="media-upload"
            type="file"
            multiple
            accept="image/*,video/*"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={handleUpload}
            disabled={isUploading}
          />

          {isUploading && (
            <div className="bg-background/90 animate-in fade-in absolute inset-0 z-10 flex flex-col items-center justify-center duration-300">
              <Icon
                name="progress_activity"
                className="text-primary mb-2 animate-spin text-[40px]"
              />
              <p className="animate-pulse text-lg font-bold">
                {Object.keys(uploadProgress).length > 0
                  ? `Streaming ${Object.values(uploadProgress)[0].toFixed(0)}%`
                  : "Optimizing Hub..."}
              </p>
              <p className="text-primary/60 mt-1 text-[10px] font-black tracking-[0.2em] uppercase">
                Splash Engine: High-Bandwidth Protocol
              </p>
            </div>
          )}
        </div>
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
          <div className="animate-in fade-in grid grid-cols-1 gap-6 duration-500 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
                className="bg-muted/40 relative flex aspect-video animate-pulse flex-col items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/20 p-4 shadow-[0_0_20px_rgba(6,182,212,0.05)]"
              >
                <Icon
                  name="progress_activity"
                  className="mb-2 animate-spin text-[24px] text-cyan-500"
                />
                <span className="text-muted-foreground max-w-full truncate px-2 text-[10px] font-black tracking-wider uppercase">
                  {file.name}
                </span>
                <span className="mt-1 text-[8px] font-bold tracking-widest text-cyan-400 uppercase">
                  {uploadProgress[file.name] !== undefined
                    ? `Uploading ${uploadProgress[file.name].toFixed(0)}%`
                    : "Optimizing..."}
                </span>
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
                window.location.search = params.toString();
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
                      window.location.search = params.toString();
                    }}
                    className={cn(
                      "h-8 w-8 p-0 text-[10px] font-black",
                      pageNum === currentPage && "border-cyan-500 bg-cyan-500/20 text-cyan-400",
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
                window.location.search = params.toString();
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
            <DialogTitle>Delete Assets</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} assets? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>
              Delete
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

