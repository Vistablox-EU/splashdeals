"use client"

import { Icon } from "@/components/ui/Icon";
import Image from "next/image"
import * as React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { optimizeImageOnClient } from "@/lib/media/client-image-optimizer"
import { uploadTicketImageAction, renameTicketImageAction } from "@/server/actions/tickets"

interface TicketImageUploadProps {
  value?: string | null
  onChange: (value: string) => void
  facilityId: string
}

/**
 * Extracts the display filename (without extension) from a Vercel Blob URL.
 * Falls back to "slika" when parsing fails.
 */
function filenameFromBlobUrl(url: string): string {
  try {
    const segments = new URL(url).pathname.split("/")
    const last = segments[segments.length - 1] ?? "slika"
    // Remove timestamp prefix (e.g. "1781886299523-") and extension
    return last
      .replace(/^\d+-/, "")
      .replace(/\.[^.]+$/, "")
  } catch {
    return "slika"
  }
}

/**
 * 📸 TicketImageUpload Component
 * Specialized uploader for SEO/OG images for specific ticket types.
 * Standardizes on 1200x630 (1.91:1) aspect ratio.
 * Uploads via server action to avoid CORS/hang issues with client-side blob SDK.
 */
export function TicketImageUpload({ value, onChange, facilityId }: TicketImageUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)

  const currentFilename = value ? filenameFromBlobUrl(value) : ""

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    const uploadPromise = (async () => {
      // Total timeout: 45s for the whole operation
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000)

      try {
        // Step 1: Optimize and resize directly on client (Canvas 1.91:1 WebP)
        const optimizeTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Optimizacija je predugo trajala — probajte sa manjom slikom")), 25000)
        )
        const optimizedBlob = await Promise.race([
          optimizeImageOnClient(file, { mode: "exact", width: 1200, height: 630, quality: 0.85 }),
          optimizeTimeout,
        ])

        const optimizedFile = new File(
          [optimizedBlob],
          `${file.name.split(".")[0] || "ticket"}-${Date.now()}.webp`,
          { type: "image/webp" }
        )

        // Step 2: Upload via server action (avoids CORS / client blob SDK hangs)
        const formData = new FormData()
        formData.append("facilityId", facilityId)
        formData.append("file", optimizedFile)

        const result = await uploadTicketImageAction(formData) as { success: boolean; url?: string; error?: string }

        if (!result.success || !result.url) {
          throw new Error(result.error || "Upload failed — server returned no URL")
        }

        onChange(result.url)
        return result.url
      } finally {
        clearTimeout(timeoutId)
      }
    })()

    toast.promise(uploadPromise, {
      loading: "Optimizacija i slanje slike...",
      success: "Slika je uspešno sačuvana!",
      error: (err) => {
        if ((err as Error)?.name === "AbortError") {
          return "Upload je predugo trajao — probajte ponovo"
        }
        return (err as Error)?.message || "Greška pri slanju slike"
      },
    })

    try {
      await uploadPromise
    } catch (err) {
      console.error("Ticket image upload failed:", err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeImage = () => {
    onChange("")
  }

  const openRename = useCallback(() => {
    if (!value) return
    setRenameValue(currentFilename)
    setRenameOpen(true)
  }, [value, currentFilename])

  const handleRename = useCallback(async () => {
    if (!value || !renameValue.trim()) return
    setIsRenaming(true)
    try {
      const result = await renameTicketImageAction(facilityId, value, renameValue.trim()) as { success: boolean; url?: string; error?: string }
      if (result.success && result.url) {
        onChange(result.url)
        toast.success("Ime slike je uspešno promenjeno!")
        setRenameOpen(false)
      } else {
        toast.error(result.error || "Greška pri promeni imena slike")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Greška pri promeni imena slike")
    } finally {
      setIsRenaming(false)
    }
  }, [value, renameValue, facilityId, onChange])

  return (
    <div className="space-y-4 relative">
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
          <Icon name="progress_activity" className="text-[40px] animate-spin text-cyan-500" />
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-500 animate-pulse">Obrađujem...</p>
        </div>
      )}

      {value ? (
        <div className="space-y-3">
          <div className="relative aspect-[1.91/1] w-full rounded-xl overflow-hidden border border-border bg-muted/50 group">
            <Image
              src={value}
              alt="Ticket Visual"
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
            {!isUploading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="rounded-full h-10 w-10"
                  onClick={removeImage}
                >
                  <Icon name="close" className="text-[20px]" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="rounded-full h-10 w-10 bg-background/80 hover:bg-background"
                  onClick={openRename}
                >
                  <Icon name="edit" className="text-[20px]" />
                </Button>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-[10px] text-foreground px-2 py-0.5 rounded font-black uppercase tracking-widest">
              1.91:1 Razmera
            </div>
          </div>

          {/* Filename display with rename trigger */}
          <div className="flex items-center gap-2">
            <Icon name="image" className="size-3.5 shrink-0 text-muted-foreground/60" />
            <span className="text-xs font-mono text-muted-foreground truncate flex-1">
              {currentFilename}.webp
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openRename}
              className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground gap-1 rounded-md"
            >
              <Icon name="edit" className="size-3" />
              Preimenuj
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            "relative aspect-[1.91/1] w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
            "hover:bg-muted/30 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5",
            isUploading ? "pointer-events-none opacity-50" : "bg-card/30 border-border/50"
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={onUpload}
          />

          <div className="h-14 w-14 rounded-full bg-muted/30 flex items-center justify-center">
            <Icon name="upload" className="text-[28px] text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground/80">Dodaj Sliku</p>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Preporučeno: 1200x630 (WebP)</p>
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Preimenuj sliku</DialogTitle>
            <DialogDescription>
              Promenite naziv fajla na blob storage-u. Ekstenzija ostaje nepromenjena.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Label htmlFor="rename-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Naziv fajla
            </Label>
            <div className="flex items-center gap-0">
              <Input
                id="rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="unesite naziv"
                className="rounded-r-none font-mono text-sm focus-visible:z-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleRename()
                  }
                }}
                autoFocus
              />
              <div className="flex items-center h-10 px-3 rounded-r-md border border-l-0 border-input bg-muted/30 text-xs font-mono text-muted-foreground select-none">
                .webp
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameOpen(false)}
              disabled={isRenaming}
            >
              Otkaži
            </Button>
            <Button
              type="button"
              onClick={handleRename}
              disabled={!renameValue.trim() || isRenaming}
            >
              {isRenaming ? (
                <>
                  <Icon name="progress_activity" className="size-4 mr-1.5 animate-spin" />
                  Čuvanje...
                </>
              ) : (
                "Sačuvaj"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
