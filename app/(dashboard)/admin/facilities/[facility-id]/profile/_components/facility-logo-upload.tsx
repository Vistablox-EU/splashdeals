"use client";

import { Icon } from "@/components/ui/Icon";
import Image from "next/image";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import { cn } from "@/lib/utils";
import { updateFacilityLogoAction } from "@/app/(server)/actions/governance";
import { optimizeImageOnClient } from "@/lib/media/client-image-optimizer";

interface FacilityLogoUploadProps {
  value?: string | null;
  onChange: (value: string) => void;
  facilityId: string;
  facilityName: string;
}

/**
 * 🎨 FacilityLogoUpload Component
 * Direct-to-storage client-side optimized logo uploader.
 * Supports static images (→ WebP) and animated GIFs (raw passthrough).
 */
export function FacilityLogoUpload({
  value,
  onChange,
  facilityId,
  facilityName,
}: FacilityLogoUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [previewBg, setPreviewBg] = React.useState<"dark" | "light">("dark");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const processFile = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Invalid file type. Please upload an image.");
      return;
    }

    setIsUploading(true);

    const uploadPromise = (async () => {
      const isGif = file.type === "image/gif";

      let uploadFile: File;
      let filename: string;

      if (isGif) {
        // 🎞️ Animated GIF — upload raw, preserve animation
        const slug = slugify(facilityName);
        filename = `facilities/${facilityId}/logos/logo-${slug}.gif`;
        uploadFile = file;
      } else {
        // 🖼️ Static image — optimize to WebP via canvas
        const optimizedBlob = await optimizeImageOnClient(file, {
          mode: "smart-crop",
          size: 512,
          quality: 0.9,
        });
        const slug = slugify(facilityName);
        filename = `facilities/${facilityId}/logos/logo-${slug}.webp`;
        uploadFile = new File([optimizedBlob], filename, { type: "image/webp" });
      }

      const blob = await upload(filename, uploadFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ facilityId, uploadType: "LOGO" }),
      });

      if (!blob.url) {
        throw new Error("Upload endpoint returned void URL");
      }

      const finalUrl = `${blob.url}?t=${Date.now()}`;

      // 🔥 INSTANT PERSISTENCE: Write directly to Database immediately
      const dbResult = await updateFacilityLogoAction(facilityId, finalUrl);
      if (!dbResult.success) {
        throw new Error("Storage successful, but database alignment failed.");
      }

      // Update local React-Hook-Form state
      onChange(finalUrl);
      return finalUrl;
    })();

    toast.promise(uploadPromise, {
      loading: isGif ? "Uploading animated logo…" : "Optimizing & shipping WebP payload…",
      success: "Logo successfully cached & deployed!",
      error: (err) => err.message || "Direct stream failure",
    });

    try {
      await uploadPromise;
    } catch (err) {
      console.error("Logo workflow fatal:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // 🌌 Drag & Drop Event Listeners
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const removeImage = async () => {
    onChange("");
    // 🔥 Instant Cleanup: Ensure removals sync to database immediately
    await updateFacilityLogoAction(facilityId, "");
    toast.success("Asset purged from visual identity.");
  };

  const isGif = value?.endsWith(".gif");

  return (
    <div
      className="group/logo relative space-y-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isUploading && (
        <div className="bg-background/80 animate-in fade-in zoom-in-95 absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-2xl backdrop-blur-md duration-300">
          <div className="relative">
            <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-md" />
            <Icon
              name="progress_activity"
              className="text-primary relative z-10 animate-spin text-[32px]"
            />
          </div>
          <p className="text-primary animate-pulse text-[9px] font-black tracking-[0.2em] uppercase">
            Rasterizing...
          </p>
        </div>
      )}

      {value ? (
        <div className="group relative mx-auto h-32 w-32">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border shadow-lg transition-all",
              previewBg === "dark"
                ? "bg-background/40 border-border hover:border-primary/40"
                : "bg-muted/50 border-muted/70 hover:border-primary",
              isDragging && "border-primary bg-primary/5 scale-105 border-dashed",
            )}
          >
            <Image
              src={value}
              alt="Facility Logo"
              fill
              sizes="128px"
              className="object-contain p-3 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              unoptimized={isGif}
            />
            {!isUploading && (
              <div className="bg-background/70 absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Icon name="upload" className="text-primary animate-bounce text-[20px]" />
                <span className="text-primary text-[8px] font-black tracking-widest uppercase">
                  Swap Logo
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  className="text-foreground border-destructive/30 bg-destructive/20 hover:bg-destructive absolute top-2 right-2 scale-90 rounded-lg border p-1.5 transition-all hover:scale-100"
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
              e.stopPropagation();
              setPreviewBg((p) => (p === "dark" ? "light" : "dark"));
            }}
            className={cn(
              "absolute bottom-2 left-2 z-20 rounded-md border p-1 shadow-sm backdrop-blur-md transition-all",
              previewBg === "dark"
                ? "bg-muted/60 border-border text-muted-foreground hover:text-foreground"
                : "border-muted/50 text-muted-foreground/80 hover:text-foreground bg-background/80",
            )}
            title="Toggle Contrast Background"
          >
            {previewBg === "dark" ? (
              <Icon name="light_mode" className="text-[10px]" />
            ) : (
              <Icon name="dark_mode" className="text-[10px]" />
            )}
          </Button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "bg-background/30 hover:bg-background/60 group/drop relative mx-auto box-border flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-300",
            isDragging
              ? "border-primary bg-primary/10 shadow-primary/15 scale-[1.02]"
              : "border-border/50 hover:border-primary/30",
          )}
        >
          <div
            className={cn(
              "mb-2 rounded-xl p-2.5 transition-all duration-300",
              isDragging
                ? "bg-primary/20 text-primary scale-110"
                : "bg-muted/50 text-muted-foreground group-hover/drop:bg-primary/10 group-hover/drop:text-primary",
            )}
          >
            <Icon name="upload" className="text-[20px]" />
          </div>
          <span
            className={cn(
              "text-[9px] font-black tracking-widest uppercase transition-colors",
              isDragging
                ? "text-primary"
                : "text-muted-foreground group-hover/drop:text-foreground/90",
            )}
          >
            {isDragging ? "Release File" : "Upload Logo"}
          </span>
          {!isDragging && (
            <span className="text-muted-foreground mt-1 text-[7px] font-bold tracking-tighter uppercase opacity-60">
              PNG / JPG / WebP / GIF
            </span>
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
  );
}
