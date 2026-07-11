"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface MediaThumbnailProps {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  altText: string | null;
  createdAt: string;
  usageCount: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPreview: (id: string) => void;
  onAction?: (url: string, altText?: string) => void;
  actionLabel?: string;
  dict: Record<string, unknown>;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function truncateFilename(name: string, max = 24): string {
  if (name.length <= max) return name;
  const ext = name.lastIndexOf(".");
  if (ext > 0 && name.length - ext <= 6) {
    return `${name.slice(0, max - 6)}...${name.slice(ext)}`;
  }
  return `${name.slice(0, max - 3)}...`;
}

function isRecent(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created < 60 * 60 * 1000; // 1 hour
}

export function MediaThumbnail({
  id,
  url,
  filename,
  size,
  mimeType,
  createdAt,
  usageCount,
  isSelected,
  onSelect,
  onPreview,
}: MediaThumbnailProps) {
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number } | null>(null);

  const handleClick = () => {
    if (isSelected) {
      onPreview(id);
    } else {
      onSelect(id);
    }
  };

  const recent = isRecent(createdAt);

  return (
    <button
      type="button"
      onClick={handleClick}
      onDoubleClick={() => onPreview(id)}
      aria-label={filename}
      className={cn(
        "group bg-card flex w-full flex-col gap-1.5 rounded-[1rem] p-2 text-left transition-[transform,box-shadow,border-color] duration-200",
        "hover:border-primary/40 focus-visible:ring-ring border hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        isSelected ? "border-primary ring-primary ring-2" : "border-border",
      )}
    >
      {/* Thumbnail image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-[calc(1rem-4px)]">
        <Image
          src={url}
          alt={filename}
          fill
          sizes="200px"
          className="object-cover transition-[transform] duration-200 group-hover:scale-105"
          onLoadingComplete={(img) => {
            setImgDimensions({ w: img.naturalWidth, h: img.naturalHeight });
          }}
        />
        {/* Recently uploaded badge */}
        {recent && (
          <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase shadow-xs">
            Novo
          </span>
        )}
      </div>

      {/* Filename */}
      <p className="text-foreground truncate px-0.5 text-xs leading-tight font-medium">
        {truncateFilename(filename)}
      </p>

      {/* Dimensions badge */}
      {imgDimensions && (
        <p className="text-muted-foreground/60 truncate px-0.5 text-[10px] leading-tight">
          {imgDimensions.w} &times; {imgDimensions.h}
        </p>
      )}

      {/* Meta row: file size + usage badge */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-muted-foreground text-[11px]">{formatFileSize(size)}</span>
        {usageCount > 0 && (
          <span
            className={cn(
              "inline-flex size-5 items-center justify-center rounded-full text-[10px] leading-none font-semibold",
              "bg-primary text-primary-foreground",
            )}
            aria-label={`Koristi se u ${usageCount} mesta`}
          >
            {usageCount}
          </span>
        )}
      </div>
    </button>
  );
}
