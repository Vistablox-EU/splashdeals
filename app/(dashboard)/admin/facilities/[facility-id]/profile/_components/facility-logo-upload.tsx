"use client"

import { Icon } from "@/components/ui/Icon";
import Image from "next/image"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { upload } from "@vercel/blob/client"
import { cn } from "@/lib/utils"
import { updateFacilityLogoAction } from "@/server/actions/governance"
import { optimizeImageOnClient } from "@/lib/media/client-image-optimizer"

interface FacilityLogoUploadProps {
  value?: string | null
  onChange: (value: string) => void
  facilityId: string
  facilityName: string
}

/**
 * 🎨 FacilityLogoUpload Component
 * Direct-to-storage client-side optimized logo uploader.
 * Supports static images (→ WebP) and animated GIFs (raw passthrough).
 */
export function FacilityLogoUpload({ value, onChange, facilityId, facilityName }: FacilityLogoUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [previewBg, setPreviewBg] = React.useState<"dark" | "light">("dark")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  const processFile = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Invalid file type. Please upload an image.")
      return
    }

    setIsUploading(true)

    const uploadPromise = (async () => {
      const isGif = file.type === "image/gif"

      let uploadFile: File
      let filename: string

      if (isGif) {
        // 🎞️ Animated GIF — upload raw, preserve animation
        const slug = slugify(facilityName)
        filename = `facilities/${facilityId}/logos/logo-${slug}.gif`
        uploadFile = file
      } else {
        // 🖼️ Static image — optimize to WebP via canvas
        const optimizedBlob = await optimizeImageOnClient(file, { mode: "smart-crop", size: 512, quality: 0.9 })
        const slug = slugify(facilityName)
        filename = `facilities/${facilityId}/logos/logo-${slug}.webp`
        uploadFile = new File([optimizedBlob], filename, { type: "image/webp" })
      }

      const blob = await upload(filename, uploadFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ facilityId, uploadType: "LOGO" }),
      })

      if (!blob.url) {
        throw new Error("Upload endpoint returned void URL")
      }

      const finalUrl = `${blob.url}?t=${Date.now()}`

      // 🔥 INSTANT PERSISTENCE: Write directly to Database immediately
      const dbResult = await updateFacilityLogoAction(facilityId, finalUrl)
      if (!dbResult.success) {
         throw new Error("Storage successful, but database alignment failed.")
      }

      // Update local React-Hook-Form state
      onChange(finalUrl)
      return finalUrl
    })()

    toast.promise(uploadPromise, {
      loading: isGif ? "Uploading animated logo…" : "Optimizing & shipping WebP payload…",
      success: "Logo successfully cached & deployed!",
      error: (err) => err.message || "Direct stream failure",
    })

    try {
      await uploadPromise
    } catch (err) {
      console.error("Logo workflow fatal:", err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  // 🌌 Drag & Drop Event Listeners
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const removeImage = async () => {
    onChange("")
    // 🔥 Instant Cleanup: Ensure removals sync to database immediately
    await updateFacilityLogoAction(facilityId, "")
    toast.success("Asset purged from visual identity.")
  }

  const isGif = value?.endsWith(".gif")

  return (
    <div 
      className="space-y-4 relative group/logo"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse" />
            <Icon name="progress_activity" className="text-[32px] animate-spin text-primary relative z-10" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">Rasterizing...</p>
        </div>
      )}

      {value ? (
        <div 
          className="relative group mx-auto h-32 w-32"
        >
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative h-full w-full rounded-2xl overflow-hidden border transition-all cursor-pointer flex items-center justify-center shadow-lg",
              previewBg === "dark" ? "bg-background/40 border-border hover:border-primary/40" : "bg-muted/50 border-muted/70 hover:border-primary",
              isDragging && "border-primary bg-primary/5 scale-105 border-dashed"
            )}
          >
          <Image 
            src={value} 
            alt="Facility Logo" 
            fill
            sizes="128px"
            className="object-contain p-3 drop-shadow-md transition-transform group-hover:scale-105 duration-300"
            unoptimized={isGif}
          />
          {!isUploading && (
            <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <Icon name="upload" className="text-[20px] text-primary animate-bounce" />
              <span className="text-[8px] font-black uppercase tracking-widest text-primary">Swap Logo</span>
              
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage()
                }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 border border-rose-500/30 text-foreground transition-all scale-90 hover:scale-100"
                title="Remove asset"
              >
                <Icon name="close" className="text-[12px]" />
              </Button>
            </div>
          )}
          </div>
          
          {/* 🌓 Contrast Mode Switcher */}
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setPreviewBg(p => p === "dark" ? "light" : "dark")
            }}
            className={cn(
              "absolute bottom-2 left-2 z-20 p-1 rounded-md backdrop-blur-md border transition-all shadow-sm",
              previewBg === "dark" 
                ? "bg-muted/60 border-border text-muted-foreground hover:text-foreground" 
                : "bg-white/80 border-muted/50 text-muted-foreground/80 hover:text-foreground"
            )}
            title="Toggle Contrast Background"
          >
            {previewBg === "dark" ? <Icon name="light_mode" className="text-[10px]" /> : <Icon name="dark_mode" className="text-[10px]" />}
          </Button>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative h-32 w-32 rounded-2xl border-2 border-dashed bg-background/30 hover:bg-background/60 transition-all duration-300 cursor-pointer mx-auto flex flex-col items-center justify-center text-center p-4 group/drop box-border",
            isDragging 
              ? "border-primary bg-primary/10 scale-[1.02] shadow-primary/15" 
              : "border-border/50 hover:border-primary/30"
          )}
        >
          <div className={cn(
             "p-2.5 rounded-xl transition-all duration-300 mb-2",
             isDragging ? "bg-primary/20 text-primary scale-110" : "bg-muted/50 text-muted-foreground group-hover/drop:bg-primary/10 group-hover/drop:text-primary"
          )}>
             <Icon name="upload" className="text-[20px]" />
          </div>
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground group-hover/drop:text-foreground/90"
          )}>
             {isDragging ? "Release File" : "Upload Logo"}
          </span>
          {!isDragging && (
            <span className="text-[7px] font-bold uppercase tracking-tighter text-muted-foreground mt-1 opacity-60">PNG / JPG / WebP / GIF</span>
          )}
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onInputChange} 
        accept="image/jpeg,image/png,image/webp,image/gif" 
        className="hidden" 
      />
    </div>
  )
}