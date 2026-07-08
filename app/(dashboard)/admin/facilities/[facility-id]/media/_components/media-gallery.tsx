"use client"

import { Icon } from "@/components/ui/Icon";
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition, useMemo, useEffect, useRef, useCallback } from "react"
import { FacilityMedia } from "@prisma/client"
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
  renameMediaAction
} from "@/server/actions/media-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
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
  type DropAnimation
} from "@dnd-kit/core"
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { upload } from "@vercel/blob/client"
import { cn } from "@/lib/utils"

interface MediaGalleryProps {
  facilityId: string
  initialMedia: FacilityMedia[]
  currentPage?: number
  totalPages?: number
  totalCount?: number
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
}

/**
 * 📐 HTML5 Hardware-Native Client-Side Optimization for Large Images
 * Downscales images to max 2000px on the longest side and converts them to high-density WebP
 * before upload, preventing Vercel's strict 4.5MB serverless payload limit from blocking the request.
 */
import { optimizeImageOnClient } from "@/lib/media/client-image-optimizer";

/**
 * Extracts the display filename (without extension) from a Vercel Blob URL.
 */
function filenameFromBlobUrl(url: string): string {
  try {
    const segments = new URL(url).pathname.split("/")
    const last = segments[segments.length - 1] ?? "fajl"
    return last
      .replace(/^\d+-/, "")
      .replace(/\.[^.]+$/, "")
  } catch {
    return "fajl"
  }
}

/**
 * Captures the first frame of a video file as a WebP blob.
 * Uses HTMLVideoElement + canvas, zero external dependencies.
 */
async function captureVideoFrame(file: File): Promise<Blob | null> {
  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement("video")
    video.muted = true
    video.playsInline = true
    video.crossOrigin = "anonymous"
    video.src = url

    // Wait for metadata, seek to 0.5s
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(0.5, video.duration || 0.5)
        resolve()
      }
      video.onerror = () => reject(new Error("Video load failed"))
      // Set a timeout in case the video is corrupt
      setTimeout(() => reject(new Error("Video load timeout")), 10000)
    })

    // Wait for seek to complete
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve()
      // If already seeked (0s video), resolve immediately
      if (video.readyState >= 2) resolve()
    })

    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 225 // 16:9
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, 400, 225)
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", 0.7)
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function MediaGallery({ facilityId, initialMedia, currentPage = 1, totalPages = 1, totalCount }: MediaGalleryProps) {
  const [media, setMedia] = useState(initialMedia)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isUploading, startUpload] = useTransition()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false)

  // Curation state — declared before filteredMedia memo
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PHOTOS" | "VIDEOS" | "HERO" | "CARDBG" | "PUBLIC" | "HIDDEN" | "MISSING_ALT">("ALL")
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [croppingMedia, setCroppingMedia] = useState<{ id: string; url: string } | null>(null)
  const [renamingMedia, setRenamingMedia] = useState<{ id: string; url: string } | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [focalPointMediaId, setFocalPointMediaId] = useState<string | null>(null)
  const [bulkCaptionText, setBulkCaptionText] = useState("")
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const filteredMedia = useMemo(() => {
    return media.filter(item => {
      // Search matches caption or filename
      const matchesSearch = searchQuery === "" || 
        (item.caption && item.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.url.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      // Category filters
      switch (activeFilter) {
        case "PHOTOS":
          return item.type === "PHOTO"
        case "VIDEOS":
          return item.type === "VIDEO"
        case "HERO":
          return item.isHero
        case "CARDBG":
          return item.isCardBackground
        case "PUBLIC":
          return item.isGalleryVisible
        case "HIDDEN":
          return !item.isGalleryVisible
        case "MISSING_ALT":
          return item.type === "PHOTO" && (!item.caption || item.caption.trim() === "")
        default:
          return true
      }
    })
  }, [media, searchQuery, activeFilter])

  const mediaIds = useMemo(() => filteredMedia.map(m => m.id), [filteredMedia])
  const activeItem = useMemo(() => media.find(m => m.id === activeId), [media, activeId])

  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(media.map(m => m.id)))
  }, [media])

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleBulkDelete = async () => {
    setShowBulkDeleteDialog(true)
  }

  const confirmBulkDelete = async () => {
    setShowBulkDeleteDialog(false)
    const idsToDelete = Array.from(selectedIds)
    setMedia(prev => prev.filter(m => !selectedIds.has(m.id)))
    setSelectedIds(new Set())
    setIsSelectionMode(false)

    startUpload(async () => {
      for (const id of idsToDelete) {
        await deleteMediaAction(id, facilityId)
      }
      toast.success(`Purged ${idsToDelete.length} assets from node`)
    })
  }

  const [isDragActive, setIsDragActive] = useState(false)
  const dragCounterRef = useRef(0)
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; type: string }[]>([])

  const processFilesUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    setUploadingFiles(prev => [...prev, ...files.map(f => ({ name: f.name, type: f.type }))])

    startUpload(async () => {
      for (const file of files) {
        const isVideo = file.type.startsWith("video/")
        
        try {
          if (isVideo) {
            // Capture thumbnail frame before uploading
            const thumbBlob = await captureVideoFrame(file)
            let thumbUrl: string | null = null
            if (thumbBlob) {
              const thumbFile = new File([thumbBlob], `thumb-${file.name}.webp`, { type: "image/webp" })
              const thumbResult = await upload(`facilities/${facilityId}/videos/thumbnails/thumb-${Date.now()}.webp`, thumbFile, {
                access: "public",
                handleUploadUrl: "/api/upload",
                clientPayload: JSON.stringify({ facilityId }),
              })
              thumbUrl = thumbResult.url
            }

            const blob = await upload(`facilities/${facilityId}/videos/${file.name}`, file, {
              access: "public",
              handleUploadUrl: "/api/upload",
              clientPayload: JSON.stringify({ facilityId }),
              onUploadProgress: (progress) => {
                setUploadProgress(prev => ({ ...prev, [file.name]: progress.percentage }))
              }
            })

            const syncResult = await syncMediaAction(facilityId, blob.url, file.type, thumbUrl)

            if (syncResult.success && "media" in syncResult) {
              setMedia(prev => [...prev, syncResult.media as FacilityMedia])
              toast.success(`Video recorded: ${file.name}`)
            } else {
              toast.error(("error" in syncResult ? syncResult.error : null) || `Sync failed for ${file.name}`)
            }
          } else {
            // Pre-process images on the client to avoid hitting the 4.5MB Serverless Function payload size limit
            const optimizedBlob = await optimizeImageOnClient(file, { mode: "fit", maxWidth: 2000, maxHeight: 2000, quality: 0.85 }).catch(() => file)
            const optimizedFile = optimizedBlob instanceof File ? optimizedBlob : new File([optimizedBlob], file.name.replace(/\\.[^.]+$/, ".webp"), { type: "image/webp" })

            const formData = new FormData()
            formData.append("facilityId", facilityId)
            formData.append("files", optimizedFile)

            const result = await uploadMediaAction(formData)
            if (result.success && "media" in result) {
              setMedia(prev => [...prev, ...(result.media as FacilityMedia[])])
              toast.success(`Photo uploaded: ${file.name}`)
            } else {
              toast.error(("error" in result ? result.error : null) || `Failed to optimize ${file.name}`)
            }
          }
        } catch (error) {
          console.error("Upload failed for:", file.name, error)
          toast.error(`Fatal error uploading ${file.name}`)
        } finally {
          setUploadProgress(prev => {
            const next = { ...prev }
            delete next[file.name]
            return next
          })
          setUploadingFiles(prev => prev.filter(f => f.name !== file.name))
        }
      }
    })
  }, [facilityId, startUpload])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await processFilesUpload(files)
    e.target.value = ""
  }

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer?.types.includes("Files")) {
        dragCounterRef.current++
        setIsDragActive(true)
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer?.types.includes("Files")) {
        dragCounterRef.current--
        if (dragCounterRef.current <= 0) {
          dragCounterRef.current = 0
          setIsDragActive(false)
        }
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy"
      }
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)
      dragCounterRef.current = 0

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files)
        await processFilesUpload(files)
      }
    }

    window.addEventListener("dragenter", handleDragEnter)
    window.addEventListener("dragleave", handleDragLeave)
    window.addEventListener("dragover", handleDragOver)
    window.addEventListener("drop", handleDrop)

    return () => {
      window.removeEventListener("dragenter", handleDragEnter)
      window.removeEventListener("dragleave", handleDragLeave)
      window.removeEventListener("dragover", handleDragOver)
      window.removeEventListener("drop", handleDrop)
    }
  }, [processFilesUpload])

  useEffect(() => {
    if (!isSelectionMode) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard to prevent firing while typing Alt tags inside the input fields
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return
      }

      const key = e.key.toLowerCase()

      if (key === "a") {
        e.preventDefault()
        handleSelectAll()
        toast.info("Selected all media assets")
      } else if (key === "d") {
        e.preventDefault()
        handleDeselectAll()
        toast.info("Deselected all media assets")
      } else if (e.key === "Escape") {
        e.preventDefault()
        setIsSelectionMode(false)
        setSelectedIds(new Set())
        toast.info("Exited curation selection mode")
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size > 0) {
        e.preventDefault()
        handleBulkDelete()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isSelectionMode, selectedIds, handleSelectAll, media])

  const handleDelete = async (id: string) => {
    const itemToDelete = media.find(m => m.id === id)
    if (!itemToDelete) return

    setMedia(prev => prev.filter(m => m.id !== id))

    const result = await deleteMediaAction(id, facilityId)
    
    if (result.success) {
      toast.success("Media deleted")
    } else {
      setMedia(prev => {
        const next = [...prev, itemToDelete]
        return next.sort((a, b) => (a.order || 0) - (b.order || 0))
      })
      toast.error(result.error || "Delete failed")
    }
  }

  // ─── Rename handler ─────────────────────────────────────────────────────────
  const handleOpenRename = useCallback((id: string, url: string) => {
    const name = filenameFromBlobUrl(url)
    setRenameValue(name)
    setRenamingMedia({ id, url })
  }, [])

  const handleRename = useCallback(async () => {
    if (!renamingMedia || !renameValue.trim()) return
    try {
      const result = await renameMediaAction(renamingMedia.id, facilityId, renameValue.trim()) as { success: boolean; media?: FacilityMedia; error?: string }
      if (result.success && result.media) {
        setMedia(prev => prev.map(m => m.id === renamingMedia.id ? result.media! : m))
        toast.success("Ime fajla je uspešno promenjeno!")
        setRenamingMedia(null)
        setRenameValue("")
      } else {
        toast.error(result.error || "Greška pri promeni imena")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška pri promeni imena")
    }
  }, [renamingMedia, renameValue, facilityId])

  const handleToggleHero = async (id: string) => {
    const item = media.find(m => m.id === id)
    if (!item) return

    // Optimistic update: unset other heroes, set this one
    setMedia(prev => prev.map(m => {
      if (m.id === id) return { ...m, isHero: !m.isHero } as FacilityMedia
      if (!item.isHero) return { ...m, isHero: false } as FacilityMedia // If we are making this hero, others must lose it
      return m
    }))

    const result = await toggleMediaHeroAction(id, facilityId)
    if (!result.success) {
      setMedia(prev => prev.map(m => m.id === id ? item : m)) // Rollback
      toast.error("Failed to update Hero status")
    } else {
      toast.success(item.isHero ? "Hero status removed" : "Set as Facility Hero")
    }
  }

  const handleToggleCardBackground = async (id: string) => {
    const item = media.find(m => m.id === id)
    if (!item) return

    // Optimistic update
    setMedia(prev => prev.map(m => {
      if (m.id === id) return { ...m, isCardBackground: !m.isCardBackground } as FacilityMedia
      if (!item.isCardBackground) return { ...m, isCardBackground: false } as FacilityMedia
      return m
    }))

    const result = await toggleMediaCardBackgroundAction(id, facilityId)
    if (!result.success) {
      setMedia(prev => prev.map(m => m.id === id ? item : m))
      toast.error("Failed to update Card Background")
    } else {
      toast.success(item.isCardBackground ? "Background removed" : "Set as Card Background")
    }
  }

  const handleToggleVisibility = async (id: string) => {
    const item = media.find(m => m.id === id)
    if (!item) return

    setMedia(prev => prev.map(m => m.id === id ? { ...m, isGalleryVisible: !m.isGalleryVisible } as FacilityMedia : m))

    const result = await toggleMediaGalleryVisibilityAction(id, facilityId)
    if (!result.success) {
      setMedia(prev => prev.map(m => m.id === id ? item : m))
      toast.error("Visibility toggle failed")
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    setMedia((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      const nextItems = arrayMove(items, oldIndex, newIndex)
      
      startUpload(async () => {
        const res = await updateMediaOrderAction(facilityId, nextItems.map(i => i.id))
        if (!res.success) {
          toast.error("Failed to save reorder")
        }
      })

      return nextItems
    })
  }

  useEffect(() => {
    if (hasUnsavedEdits) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault()
      }
      window.addEventListener('beforeunload', handler)
      return () => window.removeEventListener('beforeunload', handler)
    }
  }, [hasUnsavedEdits])

  return (
    <div className="space-y-8">
      {/* 🌌 High-fidelity Glassmorphic Full-Screen Drag Overlay */}
      {isDragActive && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[999] pointer-events-none flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
          <div className="p-12 rounded-3xl bg-muted/10 border border-primary/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center max-w-md mx-4 animate-in zoom-in-95 duration-500">
            <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 mb-8 animate-bounce">
              <Icon name="upload" className="h-16 w-16 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-3">
              Spusti datoteke za otpremanje
            </h3>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest leading-relaxed mb-1">
              Splash Engine: High-Bandwidth Protocol
            </p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest leading-relaxed">
              Asset Optimization active. Drop anywhere to start bulk curation.
            </p>
          </div>
        </div>
      )}

      {/* 🛠️ Action Toolbar */}
      <div className="flex items-center justify-between gap-4 sticky top-0 z-40 bg-background/60 backdrop-blur-md p-4 -mx-4 border-b border-border/50 shadow-2xl">
         <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode)
                setSelectedIds(new Set())
              }}
              className={cn(
                "h-9 px-4 text-[10px] font-black uppercase tracking-widest gap-2 transition-all",
                isSelectionMode ? "bg-primary/20 border-primary text-primary" : "bg-muted/30 border-border/50"
              )}
            >
               {isSelectionMode ? <Icon name="close" className="size-3" /> : <Icon name="edit" className="size-3" />}
               {isSelectionMode ? "Exit Curation" : "Selection Mode"}
            </Button>

            {isSelectionMode && (
               <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-9 px-3 text-[10px] font-black uppercase tracking-widest bg-muted/30 border border-border/50 hover:bg-muted/50"
                  >
                     Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    className="h-9 px-3 text-[10px] font-black uppercase tracking-widest bg-muted/30 border border-border/50 hover:bg-muted/50"
                  >
                     Deselect All
                  </Button>
                  {selectedIds.size > 0 && (
                     <>
                        <div className="h-4 w-[1px] bg-muted/50 mx-2" />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                          className="h-9 px-4 text-[10px] font-black uppercase tracking-widest gap-2 mr-2"
                        >
                           <Icon name="delete" className="size-3" />
                           Delete {selectedIds.size} Assets
                        </Button>

                        <div className="h-4 w-[1px] bg-muted/50 mx-2" />
                        
                        <div className="flex items-center gap-1.5 bg-black/40 border border-border/50 rounded-lg px-2 py-0.5 animate-in fade-in duration-300">
                          <input
                            type="text"
                            placeholder="Bulk Alt tag..."
                            aria-label="Bulk caption"
                            value={bulkCaptionText}
                            onChange={(e) => setBulkCaptionText(e.target.value)}
                            className="bg-transparent text-[10px] text-foreground focus:outline-none placeholder:text-muted-foreground/80 w-32 px-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const val = bulkCaptionText.trim()
                              if (!val) {
                                toast.error("Typing a bulk Alt tag is required")
                                return
                              }
                              startUpload(async () => {
                                try {
                                  const ids = Array.from(selectedIds)
                                  const res = await bulkUpdateMediaCaptionAction(ids, facilityId, val)
                                  if (res.success) {
                                    setMedia(prev => prev.map(m => ids.includes(m.id) ? { ...m, caption: val } as FacilityMedia : m))
                                    setSelectedIds(new Set())
                                    setIsSelectionMode(false)
                                    setBulkCaptionText("")
                                    toast.success(`Bulk ALT tag updated for ${ids.length} images`)
                                  } else {
                                    toast.error("Failed to apply bulk Alt tag")
                                  }
                                } catch (err) {
                                  console.error(err)
                                  toast.error("Bulk save error")
                                }
                              })
                            }}
                            disabled={isUploading}
                            className="h-7 px-2 text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 gap-1"
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
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2">
               {media.length} Registry Objects
            </span>
         </div>
      </div>

      {/* 🔍 Curation Search & Filter Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/30 border border-border/50 rounded-2xl p-4 animate-in fade-in duration-300">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pretraži medije po ALT oznaci ili nazivu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-border/50 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-foreground/90 placeholder:text-muted-foreground/80 focus:outline-none focus:border-ring transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <Icon name="close" className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Badges Row */}
        <div className="flex flex-wrap gap-2 items-center">
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
                "h-7 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                activeFilter === filt.id
                  ? "bg-cyan-500/20 border border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "bg-muted/10 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              {filt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Upload Zone (Integrated Empty State) */}
      {!isSelectionMode && (
        <div className={cn(
          "relative group overflow-hidden border-2 border-dashed border-border/50 rounded-xl bg-muted/40 backdrop-blur-md transition-all hover:bg-muted/60 hover:border-primary/50 flex flex-col items-center justify-center text-center cursor-pointer",
          media.length === 0 && !isUploading ? "py-32" : "py-12"
        )}>
          {media.length === 0 && !isUploading ? (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-500 max-w-sm">
              <div className="p-6 rounded-3xl bg-muted/10 border border-border/50 mb-8 group-hover:scale-110 group-hover:bg-primary/5 transition-all duration-500">
                <Icon name="image" className="text-[48px] text-muted-foreground/80 group-hover:text-primary transition-colors" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">Media Node Empty</h3>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest leading-relaxed">
                  The facility gallery is currently void of visual intelligence. Drop assets here to initiate curation.
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-2">Click or drag to upload files</p>
              </div>
            </div>
          ) : (
            <>
              <Icon name="upload" className="text-[48px] text-muted-foreground group-hover:text-primary transition-colors mb-4" />
              <div className="space-y-1">
                <p className="text-base font-semibold">Drop your files here, or browse local</p>
                <p className="text-sm text-muted-foreground">Photos and Videos supported. WebP processing active.</p>
              </div>
            </>
          )}

          <label htmlFor="media-upload" className="sr-only">Select photos or videos to upload</label>
          <input 
            id="media-upload"
            type="file" 
            multiple 
            accept="image/*,video/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleUpload}
            disabled={isUploading}
          />

          {isUploading && (
            <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center z-10 animate-in fade-in duration-300">
              <Icon name="progress_activity" className="text-[40px] animate-spin text-primary mb-2" />
              <p className="font-bold text-lg animate-pulse">
                {Object.keys(uploadProgress).length > 0 
                  ? `Streaming ${Object.values(uploadProgress)[0].toFixed(0)}%` 
                  : "Optimizing Hub..."}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60 mt-1">Splash Engine: High-Bandwidth Protocol</p>
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
        <SortableContext 
          items={mediaIds}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-in fade-in duration-500">
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
                onToggleFocalPoint={() => setFocalPointMediaId(focalPointMediaId === item.id ? null : item.id)}
                onCrop={() => setCroppingMedia({ id: item.id, url: item.url })}
                onFocalPointSaved={(id, coords) => setMedia(prev => prev.map(m => m.id === id ? { ...m, focalPoint: coords } : m))}
                onUnsavedEdit={setHasUnsavedEdits}
                onRename={() => handleOpenRename(item.id, item.url)}
              />
            ))}

            {/* Skeletons for assets currently in transit */}
            {uploadingFiles.map((file, idx) => (
              <div 
                key={`transiting-${idx}-${file.name}`}
                className="bg-muted/40 border border-cyan-500/20 rounded-2xl aspect-video relative overflow-hidden flex flex-col items-center justify-center p-4 shadow-[0_0_20px_rgba(6,182,212,0.05)] animate-pulse"
              >
                <Icon name="progress_activity" className="text-[24px] text-cyan-500 animate-spin mb-2" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider truncate max-w-full px-2">
                  {file.name}
                </span>
                <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest mt-1">
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
            <div className="z-50 scale-105 transition-transform duration-300 cursor-grabbing">
              <MediaItemCard item={activeItem} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 📄 Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 py-4 border-t border-border/50 mt-8">
          <div className="text-[11px] font-medium text-muted-foreground">
            {totalCount !== undefined && `${totalCount} assets total`}
            {totalCount !== undefined && totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => {
                const params = new URLSearchParams(window.location.search)
                params.set("page", String(currentPage - 1))
                window.location.search = params.toString()
              }}
              className="h-8 px-3 text-[10px] font-black uppercase tracking-widest"
            >
              <Icon name="keyboard_arrow_left" className="size-3.5 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                // Show window around current page
                let pageNum: number
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (currentPage <= 4) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = currentPage - 3 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search)
                      params.set("page", String(pageNum))
                      window.location.search = params.toString()
                    }}
                    className={cn(
                      "h-8 w-8 p-0 text-[10px] font-black",
                      pageNum === currentPage && "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                    )}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(window.location.search)
                params.set("page", String(currentPage + 1))
                window.location.search = params.toString()
              }}
              className="h-8 px-3 text-[10px] font-black uppercase tracking-widest"
            >
              Next
              <Icon name="keyboard_arrow_right" className="size-3.5 ml-1" />
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
              Are you sure you want to delete {selectedIds.size} assets? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✂️ High-Fidelity Canvas Image Cropper Modal */}
      {croppingMedia && (
        <CropModal 
          media={croppingMedia} 
          onClose={() => setCroppingMedia(null)} 
          onSave={async (file: File) => {
            await processFilesUpload([file])
            setCroppingMedia(null)
          }}
        />
      )}

      {/* ✏️ Rename File Dialog */}
      <Dialog open={!!renamingMedia} onOpenChange={(open) => { if (!open) { setRenamingMedia(null); setRenameValue(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Preimenuj fajl</DialogTitle>
            <DialogDescription>
              Promenite naziv fajla na blob storage-u. Ekstenzija ostaje nepromenjena.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Label htmlFor="media-rename-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                    e.preventDefault()
                    handleRename()
                  }
                }}
                autoFocus
              />
              <div className="flex items-center h-10 px-3 rounded-r-md border border-l-0 border-input bg-muted/30 text-xs font-mono text-muted-foreground select-none">
                .{renamingMedia ? renamingMedia.url.split("?")[0].split(".").pop()?.toLowerCase() || "webp" : "webp"}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setRenamingMedia(null); setRenameValue(""); }}
            >
              Otkaži
            </Button>
            <Button
              type="button"
              onClick={handleRename}
              disabled={!renameValue.trim()}
            >
              Sačuvaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MediaItemCard({
  item, 
  onDelete, 
  isOverlay, 
  isSelected, 
  isSelectionMode, 
  onSelect, 
  listeners, 
  attributes, 
  onToggleHero, 
  onToggleCardBG, 
  onToggleVisibility,
  focalPointMediaId,
  onToggleFocalPoint,
  onCrop,
  onFocalPointSaved,
  onUnsavedEdit,
  onRename
}: { 
  item: FacilityMedia, 
  onDelete?: () => void,
  isOverlay?: boolean,
  isSelected?: boolean,
  isSelectionMode?: boolean,
  onSelect?: () => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listeners?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: any,
  onToggleHero?: () => void,
  onToggleCardBG?: () => void,
  onToggleVisibility?: () => void,
  focalPointMediaId?: string | null,
  onToggleFocalPoint?: () => void,
  onCrop?: () => void,
  onFocalPointSaved?: (id: string, coords: string) => void,
  onUnsavedEdit?: (value: boolean) => void,
  onRename?: () => void
}) {
  const [isPortrait, setIsPortrait] = useState(false)
  const extension = item.url.substring(item.url.lastIndexOf(".") + 1).split("?")[0].toUpperCase();

  return (
    <div className={cn(
      "group flex flex-col bg-muted/40 rounded-2xl border border-border/50 overflow-hidden transition-all duration-300",
      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.3)]",
      isOverlay && "shadow-2xl opacity-90 scale-105"
    )}>
      {/* 🖼️ Thumbnail Area */}
      <div 
        onClick={() => isSelectionMode && onSelect?.()}
        className={cn(
          "aspect-video relative overflow-hidden bg-background",
          isSelectionMode && "cursor-pointer"
        )}
      >
        {/* Render focal target dot */}
        {item.focalPoint && item.type === "PHOTO" && (
          <div 
            className="absolute size-5 rounded-full border-2 border-cyan-400 bg-cyan-950/70 z-30 shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ 
              left: `${item.focalPoint.split(",")[0]}%`, 
              top: `${item.focalPoint.split(",")[1]}%` 
            }}
          >
            <div className="size-1.5 rounded-full bg-cyan-400" />
          </div>
        )}

        {/* Focal point click overlay selection */}
        {focalPointMediaId === item.id && (
          <div 
            onClick={async (e) => {
              e.stopPropagation()
              const rect = e.currentTarget.getBoundingClientRect()
              const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
              const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
              
              try {
                const res = await updateMediaFocalPointAction(item.id, item.facilityId, `${x},${y}`)
                if (res.success) {
                  toast.success(`Focal point set to ${x}%, ${y}%`)
                  onFocalPointSaved?.(item.id, `${x},${y}`)
                  onToggleFocalPoint?.()
                } else {
                  toast.error("Failed to save focal point")
                }
              } catch (err) {
                console.error(err)
                toast.error("Error setting focal point")
              }
            }}
            className="absolute inset-0 bg-primary/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-3 cursor-crosshair animate-in fade-in duration-200"
          >
            <Icon name="gps_fixed" className="size-6 text-primary animate-pulse mb-1.5" />
            <span className="text-[10px] font-black text-foreground uppercase tracking-wider">
              Postavi Fokus
            </span>
            <span className="text-[8px] font-medium text-primary/60 uppercase tracking-widest mt-0.5 leading-tight max-w-[120px]">
              Klikni bilo gde za pozicioniranje
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFocalPoint?.()
              }}
              className="absolute bottom-2 right-2 size-5 rounded-md bg-muted/50 hover:bg-white/20 flex items-center justify-center text-foreground"
              aria-label="Close focal point"
            >
              <Icon name="close" className="size-3" />
            </button>
          </div>
        )}

        {item.type === "PHOTO" ? (
          <>
            <Image 
              src={item.url} 
              alt={item.caption || "Facility media photo"} 
              fill
              className={cn(
                "object-cover transition-transform duration-500 group-hover:scale-110",
                !item.isGalleryVisible && "opacity-40 grayscale"
              )}
              onLoadingComplete={(img) => {
                if (img.naturalHeight > img.naturalWidth) {
                  setIsPortrait(true)
                }
              }}
            />
            {isPortrait && (
              <div className="absolute bottom-3 left-3 bg-amber-500 text-slate-950 text-[8px] font-black uppercase px-2 py-0.5 rounded-md z-30 opacity-100 group-hover:opacity-0 transition-opacity flex items-center gap-0.5 shadow-lg">
                ⚠️ Portrait
              </div>
            )}
          </>
        ) : (
          <div className="h-full w-full relative">
            <video 
              src={`${item.url}#t=0.1`} 
              poster={item.thumbnailUrl || undefined}
              className={cn(
                "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
                !item.isGalleryVisible && "opacity-40 grayscale"
              )} 
              preload="metadata"
              muted 
              playsInline 
              onMouseEnter={(e) => {
                e.currentTarget.play().catch(err => console.warn("Video autoplay blocked", err));
              }}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0.1;
              }}
            />
            <div className="absolute top-3 left-3 bg-black/60 border border-border p-1.5 rounded-lg z-30">
              <Icon name="movie" className="size-3.5 text-cyan-400 animate-pulse" />
            </div>
          </div>
        )}

        {/* Dynamic extension badge on hover */}
        <div className="absolute bottom-3 left-3 bg-black/60 border border-border text-[8px] font-black text-foreground/80 uppercase px-2 py-0.5 rounded-md z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          {extension}
        </div>

        {/* Drag Handle Overlay */}
        {!isSelectionMode && !isOverlay && (
          <div 
            {...listeners} 
            {...attributes}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <Icon name="drag_indicator" className="size-8 text-foreground/50" />
          </div>
        )}

        {/* Selection Checkmark */}
        {isSelectionMode && (
           <div className="absolute top-3 left-3 z-30">
              <div className={cn(
                 "size-6 rounded-full border-2 transition-all flex items-center justify-center",
                 isSelected ? "bg-primary border-primary" : "bg-black/40 border-border"
              )}>
                 {isSelected && <Icon name="security" className="size-4 text-slate-950 stroke-[3]" />}
              </div>
           </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-30">
          {item.isHero && (
            <div className="bg-amber-500 text-slate-950 text-[8px] font-black uppercase px-2 py-1 rounded-md shadow-lg flex items-center gap-1 animate-pulse">
              <Icon name="star" className="size-3 fill-current" />
              Hero
            </div>
          )}
          {item.isCardBackground && (
            <div className="bg-cyan-500 text-slate-950 text-[8px] font-black uppercase px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
              <Icon name="dashboard" className="size-3 fill-current" />
              Card BG
            </div>
          )}
        </div>

        {/* Delete Button */}
        {!isSelectionMode && !isOverlay && (
          <Button
            variant="destructive"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="absolute bottom-3 right-3 size-8 rounded-xl opacity-60 group-hover:opacity-100 focus-visible:opacity-100 transition-all z-30"
            aria-label="Delete media"
          >
            <Icon name="delete" className="size-4" />
          </Button>
        )}
      </div>

      {/* 🛠️ Action Controls (Below Thumbnail) */}
      {!isOverlay && (
        <div className="p-3 bg-muted/10 border-t border-border/50 grid grid-cols-3 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleHero}
            className={cn(
              "flex flex-col h-auto py-2 gap-1 text-[9px] font-black uppercase tracking-tighter hover:bg-amber-500/10",
              item.isHero ? "text-amber-500" : "text-muted-foreground"
            )}
          >
            <Icon name="monitor" className={cn("size-4", item.isHero && "fill-current")} />
            Hero
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCardBG}
            className={cn(
              "flex flex-col h-auto py-2 gap-1 text-[9px] font-black uppercase tracking-tighter hover:bg-cyan-500/10",
              item.isCardBackground ? "text-cyan-500" : "text-muted-foreground"
            )}
          >
            <Icon name="dashboard" className={cn("size-4", item.isCardBackground && "fill-current")} />
            Card BG
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVisibility}
            className={cn(
              "flex flex-col h-auto py-2 gap-1 text-[9px] font-black uppercase tracking-tighter hover:bg-primary/10",
              item.isGalleryVisible ? "text-emerald-500" : "text-muted-foreground"
            )}
          >
            {item.isGalleryVisible ? <Icon name="visibility" className="size-4" /> : <Icon name="visibility_off" className="size-4" />}
            {item.isGalleryVisible ? "Public" : "Hidden"}
          </Button>
        </div>
      )}

      {/* ✍️ Inline Caption Editor */}
      {!isOverlay && !isSelectionMode && (
        <div className="px-3 pb-1 bg-white/[0.01] flex items-center gap-2">
          {/* Filename badge */}
          <div className="flex flex-1 items-center gap-1.5 min-w-0">
            <Icon name="insert_drive_file" className="size-3 shrink-0 text-muted-foreground/50" />
            <span className="text-[10px] font-mono text-muted-foreground/70 truncate min-w-0">
              {filenameFromBlobUrl(item.url)}.{extension.toLowerCase()}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRename}
              className="h-5 px-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 hover:text-foreground shrink-0 rounded-md"
            >
              <Icon name="edit" className="size-2.5 mr-0.5" />
              Preimenuj
            </Button>
          </div>
        </div>
      )}

      {/* ✍️ Inline Caption Editor */}
      {!isOverlay && !isSelectionMode && (
        <div className="px-3 pb-3 pt-1 bg-white/[0.01] flex items-center gap-2">
          <input
            type="text"
            placeholder="Add descriptive SEO ALT tag..."
            aria-label="Image caption"
            key={item.caption || ""}
            defaultValue={item.caption || ""}
            onFocus={() => onUnsavedEdit?.(true)}
            onBlur={async (e) => {
              const val = e.target.value.trim() || null;
              if (val === item.caption) { onUnsavedEdit?.(false); return; }
              try {
                const res = await updateMediaCaptionAction(item.id, item.facilityId, val);
                if (res.success) {
                  toast.success("SEO Caption updated successfully");
                  onUnsavedEdit?.(false);
                } else {
                  toast.error("Failed to save caption");
                }
              } catch (err) {
                console.error(err);
                toast.error("Caption save error");
              }
            }}
            className="w-full bg-black/20 border border-border/50 rounded-lg px-2.5 py-1 text-[10px] font-medium text-foreground/80 focus:outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/80"
          />
          {item.type === "PHOTO" && (
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleFocalPoint?.()}
                className={cn(
                  "size-7 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 border border-border/50 transition-colors",
                  item.originalUrl ? "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" : "text-muted-foreground"
                )}
                title="Set focal point"
                aria-label="Set focal point"
              >
                <Icon name="gps_fixed" className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCrop?.()}
                className="size-7 rounded-lg hover:bg-cyan-500/10 text-muted-foreground hover:text-cyan-400 border border-border/50 transition-colors"
                title="Crop image"
                aria-label="Crop image"
              >
                <Icon name="crop" className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SortableMediaItem({ 
  item, 
  isSelected, 
  isSelectionMode, 
  onSelect, 
  onDelete, 
  onToggleHero, 
  onToggleCardBG,
  onToggleVisibility,
  focalPointMediaId,
  onToggleFocalPoint,
  onCrop,
  onFocalPointSaved,
  onUnsavedEdit,
  onRename
}: { 
  item: FacilityMedia, 
  isSelected: boolean,
  isSelectionMode: boolean,
  onSelect: () => void,
  onDelete: () => void,
  onToggleHero: () => void,
  onToggleCardBG: () => void,
  onToggleVisibility: () => void,
  focalPointMediaId?: string | null,
  onToggleFocalPoint?: () => void,
  onCrop?: () => void,
  onFocalPointSaved?: (id: string, coords: string) => void,
  onUnsavedEdit?: (value: boolean) => void,
  onRename?: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: item.id,
    disabled: isSelectionMode 
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <MediaItemCard 
        item={item} 
        isSelected={isSelected}
        isSelectionMode={isSelectionMode}
        onSelect={onSelect}
        onDelete={onDelete} 
        listeners={listeners} 
        attributes={attributes} 
        onToggleHero={onToggleHero}
        onToggleCardBG={onToggleCardBG}
        onToggleVisibility={onToggleVisibility}
        focalPointMediaId={focalPointMediaId}
        onToggleFocalPoint={onToggleFocalPoint}
        onCrop={onCrop}
        onFocalPointSaved={onFocalPointSaved}
        onUnsavedEdit={onUnsavedEdit}
        onRename={onRename}
      />
    </div>
  )
}

/**
 * ✂️ High-Fidelity Client-Side HTML5 Canvas Image Cropper Modal
 * Supports preset dynamic ratios (16:9, 4:3, 1:1), live zoom, translation offsets,
 * and high-definition WebP rendering output with zero external UI cropping library dependencies.
 */
function CropModal({ 
  media, 
  onClose, 
  onSave 
}: { 
  media: { id: string; url: string }, 
  onClose: () => void, 
  onSave: (file: File) => Promise<void> 
}) {
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "4:3" | "1:1">("16:9")
  const [zoom, setZoom] = useState(1.0)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Redraw preview canvas whenever sliders or aspect ratio changes
  useEffect(() => {
    const img = imageRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions based on preset ratio
    let targetW = 400
    let targetH = 225 // Default 16:9 preview size

    if (aspectRatio === "4:3") {
      targetW = 400
      targetH = 300
    } else if (aspectRatio === "1:1") {
      targetW = 350
      targetH = 350
    }

    canvas.width = targetW
    canvas.height = targetH

    // Centering calculations
    ctx.fillStyle = "#090d16"
    ctx.fillRect(0, 0, targetW, targetH)

    const imgRatio = img.naturalWidth / img.naturalHeight
    const canvasRatio = targetW / targetH

    let drawW = targetW
    let drawH = targetH

    if (imgRatio > canvasRatio) {
      drawW = targetH * imgRatio
    } else {
      drawH = targetW / imgRatio
    }

    drawW *= zoom
    drawH *= zoom

    const x = (targetW - drawW) / 2 + (offsetX * targetW / 100)
    const y = (targetH - drawH) / 2 + (offsetY * targetH / 100)

    ctx.drawImage(img, x, y, drawW, drawH)
  }, [aspectRatio, zoom, offsetX, offsetY])

  const handleSave = () => {
    const img = imageRef.current
    if (!img) return

    setIsSaving(true)

    // Build the high-resolution cropped image on a large canvas
    let targetW = 1200
    let targetH = 675 // Default 16:9 high-res

    if (aspectRatio === "4:3") {
      targetW = 1000
      targetH = 750
    } else if (aspectRatio === "1:1") {
      targetW = 800
      targetH = 800
    }

    const canvas = document.createElement("canvas")
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext("2d")
    
    if (ctx) {
      ctx.fillStyle = "#090d16"
      ctx.fillRect(0, 0, targetW, targetH)

      const imgRatio = img.naturalWidth / img.naturalHeight
      const canvasRatio = targetW / canvas.height

      let drawW = targetW
      let drawH = targetH

      if (imgRatio > canvasRatio) {
        drawW = targetH * imgRatio
      } else {
        drawH = targetW / imgRatio
      }

      drawW *= zoom
      drawH *= zoom

      const x = (targetW - drawW) / 2 + (offsetX * targetW / 100)
      const y = (targetH - drawH) / 2 + (offsetY * targetH / 100)

      ctx.drawImage(img, x, y, drawW, drawH)

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const file = new File([blob], `cropped-${Date.now()}.webp`, { type: "image/webp" })
            await onSave(file)
          }
          setIsSaving(false)
        },
        "image/webp",
        0.85
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Hidden raw image for canvas extraction */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        ref={imageRef} 
        src={media.url} 
        alt="Raw crop src" 
        className="hidden" 
        crossOrigin="anonymous"
        onLoad={() => {
          // Trigger render effect
          setZoom(1.0001) 
        }}
      />

      <div className="bg-muted/90 border border-border rounded-3xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col gap-6 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div>
            <h3 className="text-lg font-black text-foreground uppercase tracking-tighter">Iseci fotografiju</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Crop utility: re-encodes to high-density WebP</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl size-8" aria-label="Close crop dialog">
            <Icon name="close" className="size-4" />
          </Button>
        </div>

        {/* Live Canvas Preview */}
        <div className="flex justify-center bg-background/80 border border-border/50 rounded-2xl overflow-hidden py-4">
          <canvas ref={canvasRef} className="rounded-xl border border-border/50 shadow-2xl max-w-full" />
        </div>

        {/* Presets and Sliders */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Proporcija (Aspect Ratio)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "16:9", label: "16:9 (Hero/Bazen)" },
                { id: "4:3", label: "4:3 (Kartica BG)" },
                { id: "1:1", label: "1:1 (Kvadrat)" },
              ].map((ratio) => (
                <Button
                  key={ratio.id}
                  variant={aspectRatio === ratio.id ? "default" : "outline"}
                  size="sm"
                  type="button"
                  onClick={() => setAspectRatio(ratio.id as typeof aspectRatio)}
                  className={cn(
                    "py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    aspectRatio === ratio.id 
                      ? "bg-cyan-500/20 border border-cyan-500 text-cyan-400" 
                      : "bg-muted/10 border border-border/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {ratio.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Slider controls */}
          <div className="space-y-3 bg-white/[0.01] border border-border/50 rounded-xl p-3">
            {/* Zoom Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Uvećanje (Zoom)</span>
                <span className="font-mono text-cyan-400">{zoom.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="3.0" 
                step="0.1" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1 bg-background rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Horizontal Position X Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Vodoravno pomeranje (X osa)</span>
                <span className="font-mono text-cyan-400">{offsetX}%</span>
              </div>
              <input 
                type="range" 
                min="-50" 
                max="50" 
                step="1" 
                value={offsetX} 
                onChange={(e) => setOffsetX(parseInt(e.target.value))}
                className="w-full h-1 bg-background rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Vertical Position Y Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Uspravno pomeranje (Y osa)</span>
                <span className="font-mono text-cyan-400">{offsetY}%</span>
              </div>
              <input 
                type="range" 
                min="-50" 
                max="50" 
                step="1" 
                value={offsetY} 
                onChange={(e) => setOffsetY(parseInt(e.target.value))}
                className="w-full h-1 bg-background rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Modal CTAs */}
        <div className="flex items-center justify-end gap-3 border-t border-border/50 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isSaving} className="h-9 px-4 text-[10px] font-black uppercase tracking-widest">
            Otkaži
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="h-9 px-5 bg-cyan-500 text-slate-950 hover:bg-cyan-400 text-[10px] font-black uppercase tracking-widest gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            {isSaving ? (
              <>
                <Icon name="progress_activity" className="size-3 animate-spin text-slate-950" />
                Sečenje...
              </>
            ) : (
              <>
                <Icon name="crop" className="size-3 text-slate-950" />
                Sačuvaj i Otpremi
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
