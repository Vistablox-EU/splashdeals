"use client"

import { Icon } from "@/components/ui/Icon";
/* eslint-disable @typescript-eslint/no-unused-vars */

import Image from "next/image"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { upload } from "@vercel/blob/client"
import { cn } from "@/lib/utils"
import { optimizeImageOnClient } from "@/lib/media/client-image-optimizer"

interface TicketImageUploadProps {
  value?: string | null
  onChange: (value: string) => void
  facilityId: string
}

/**
 * 📸 TicketImageUpload Component
 * Specialized uploader for SEO/OG images for specific ticket types.
 * Standardizes on 1200x630 (1.91:1) aspect ratio.
 */
export function TicketImageUpload({ value, onChange, facilityId }: TicketImageUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    const uploadPromise = (async () => {
      // Step 1: Optimize and resize directly on client (Canvas 1.91:1 WebP)
      const optimizedBlob = await optimizeImageOnClient(file, { mode: "exact", width: 1200, height: 630, quality: 0.85 })
      const optimizedFile = new File(
        [optimizedBlob],
        `${file.name.split(".")[0] || "ticket"}-${Date.now()}.webp`,
        { type: "image/webp" }
      )

      // Step 2: Stream optimized WebP directly from browser to Vercel Blob
      const filename = `facilities/${facilityId}/tickets/${optimizedFile.name}`
      const blob = await upload(filename, optimizedFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ facilityId, uploadType: "TICKET" }),
      })

      if (!blob.url) {
        throw new Error("Direct client upload returned empty URL")
      }

      onChange(blob.url)
      return blob.url
    })()

    toast.promise(uploadPromise, {
      loading: "Optimizacija i slanje slike...",
      success: "Slika je uspešno sačuvana!",
      error: (err) => err.message || "Greška pri slanju slike",
    })

    try {
      await uploadPromise
    } catch (err) {
      console.error("Direct client-side upload failed:", err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeImage = () => {
    onChange("")
  }

  return (
    <div className="space-y-4 relative">
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
          <Icon name="progress_activity" className="text-[40px] animate-spin text-cyan-500" />
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-500 animate-pulse">Obrađujem...</p>
        </div>
      )}

      {value ? (
        <div className="relative aspect-[1.91/1] w-full rounded-xl overflow-hidden border border-white/10 bg-muted/50 group">
          <Image 
            src={value} 
            alt="Ticket Visual" 
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
          />
          {!isUploading && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="rounded-full h-10 w-10"
                onClick={removeImage}
              >
                <Icon name="close" className="text-[20px]" />
              </Button>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded font-black uppercase tracking-widest">
            1.91:1 Razmera
          </div>
        </div>
      ) : (
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            "relative aspect-[1.91/1] w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all",
            "hover:bg-white/5 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5",
            isUploading ? "pointer-events-none opacity-50" : "bg-card/30 border-white/5"
          )}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*"
            onChange={onUpload}
          />
          
          <div className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center">
            <Icon name="upload" className="text-[28px] text-slate-500" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-slate-300">Dodaj Sliku</p>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Preporučeno: 1200x630 (WebP)</p>
          </div>
        </div>
      )}
    </div>
  )
}
