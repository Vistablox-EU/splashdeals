"use client";

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

export function MediaThumbnail({
  id,
  url,
  filename,
  size,
  mimeType,
  altText,
  usageCount,
  isSelected,
  onSelect,
  onPreview,
}: MediaThumbnailProps) {
  const handleClick = () => {
    if (isSelected) {
      onPreview(id);
    } else {
      onSelect(id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onDoubleClick={() => onPreview(id)}
      aria-label={altText || filename}
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
          alt={altText || filename}
          fill
          sizes="200px"
          className="object-cover transition-[transform] duration-200 group-hover:scale-105"
        />
      </div>

      {/* Filename */}
      <p className="text-foreground truncate px-0.5 text-xs leading-tight font-medium">
        {truncateFilename(filename)}
      </p>

      {/* Meta row: file size + usage badge */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-muted-foreground text-[11px]">{formatFileSize(size)}</span>
        {usageCount > 0 && (
          <span
            className={cn(
              "inline-flex size-5 items-center justify-center rounded-full text-[10px] leading-none font-semibold",
              usageCount > 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
            aria-label={`Koristi se u ${usageCount} ${usageCount === 1 ? "mesta" : "mesta"}`}
          >
            {usageCount}
          </span>
        )}
      </div>
    </button>
  );
}
