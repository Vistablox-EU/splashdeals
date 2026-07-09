"use client";

import { Icon } from "@/components/ui/Icon";
import Image from "next/image";
import { useState } from "react";
import { FacilityMedia } from "@prisma/client";
import {
  updateMediaCaptionAction,
  updateMediaFocalPointAction,
} from "@/server/actions/media-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { filenameFromBlobUrl } from "./_lib/media-utils";

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
  onRename,
}: {
  item: FacilityMedia;
  onDelete?: () => void;
  isOverlay?: boolean;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onSelect?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listeners?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: any;
  onToggleHero?: () => void;
  onToggleCardBG?: () => void;
  onToggleVisibility?: () => void;
  focalPointMediaId?: string | null;
  onToggleFocalPoint?: () => void;
  onCrop?: () => void;
  onFocalPointSaved?: (id: string, coords: string) => void;
  onUnsavedEdit?: (value: boolean) => void;
  onRename?: () => void;
}) {
  const [isPortrait, setIsPortrait] = useState(false);
  const extension = item.url
    .substring(item.url.lastIndexOf(".") + 1)
    .split("?")[0]
    .toUpperCase();

  return (
    <div
      className={cn(
        "group bg-muted/40 border-border/50 flex flex-col overflow-hidden rounded-2xl border transition-all duration-300",
        isSelected &&
          "ring-primary shadow-[0_0_30px_rgba(6,182,212,0.3)] ring-2 ring-offset-2 ring-offset-slate-950",
        isOverlay && "scale-105 opacity-90 shadow-2xl",
      )}
    >
      {/* 🖼️ Thumbnail Area */}
      <div
        onClick={() => isSelectionMode && onSelect?.()}
        className={cn(
          "bg-background relative aspect-video overflow-hidden",
          isSelectionMode && "cursor-pointer",
        )}
      >
        {/* Render focal target dot */}
        {item.focalPoint && item.type === "PHOTO" && (
          <div
            className="pointer-events-none absolute z-30 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-cyan-400 bg-cyan-950/70 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            style={{
              left: `${item.focalPoint.split(",")[0]}%`,
              top: `${item.focalPoint.split(",")[1]}%`,
            }}
          >
            <div className="size-1.5 rounded-full bg-cyan-400" />
          </div>
        )}

        {/* Focal point click overlay selection */}
        {focalPointMediaId === item.id && (
          <div
            onClick={async (e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
              const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

              try {
                const res = await updateMediaFocalPointAction(
                  item.id,
                  item.facilityId,
                  `${x},${y}`,
                );
                if (res.success) {
                  toast.success(`Focal point set to ${x}%, ${y}%`);
                  onFocalPointSaved?.(item.id, `${x},${y}`);
                  onToggleFocalPoint?.();
                } else {
                  toast.error("Failed to save focal point");
                }
              } catch (err) {
                console.error(err);
                toast.error("Error setting focal point");
              }
            }}
            className="bg-primary/80 animate-in fade-in absolute inset-0 z-30 flex cursor-crosshair flex-col items-center justify-center p-3 text-center backdrop-blur-sm duration-200"
          >
            <Icon name="gps_fixed" className="text-primary mb-1.5 size-6 animate-pulse" />
            <span className="text-foreground text-[10px] font-black tracking-wider uppercase">
              Postavi Fokus
            </span>
            <span className="text-primary/60 mt-0.5 max-w-[120px] text-[8px] leading-tight font-medium tracking-widest uppercase">
              Klikni bilo gde za pozicioniranje
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFocalPoint?.();
              }}
              className="bg-muted/50 text-foreground absolute right-2 bottom-2 flex size-5 items-center justify-center rounded-md hover:bg-white/20"
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
                !item.isGalleryVisible && "opacity-40 grayscale",
              )}
              onLoadingComplete={(img) => {
                if (img.naturalHeight > img.naturalWidth) {
                  setIsPortrait(true);
                }
              }}
            />
            {isPortrait && (
              <div className="absolute bottom-3 left-3 z-30 flex items-center gap-0.5 rounded-md bg-amber-500 px-2 py-0.5 text-[8px] font-black text-slate-950 uppercase opacity-100 shadow-lg transition-opacity group-hover:opacity-0">
                ⚠️ Portrait
              </div>
            )}
          </>
        ) : (
          <div className="relative h-full w-full">
            <video
              src={`${item.url}#t=0.1`}
              poster={item.thumbnailUrl || undefined}
              className={cn(
                "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
                !item.isGalleryVisible && "opacity-40 grayscale",
              )}
              preload="metadata"
              muted
              playsInline
              onMouseEnter={(e) => {
                e.currentTarget.play().catch((err) => console.warn("Video autoplay blocked", err));
              }}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0.1;
              }}
            />
            <div className="border-border absolute top-3 left-3 z-30 rounded-lg border bg-black/60 p-1.5">
              <Icon name="movie" className="size-3.5 animate-pulse text-cyan-400" />
            </div>
          </div>
        )}

        {/* Dynamic extension badge on hover */}
        <div className="border-border text-foreground/80 absolute bottom-3 left-3 z-30 rounded-md border bg-black/60 px-2 py-0.5 text-[8px] font-black uppercase opacity-0 transition-opacity group-hover:opacity-100">
          {extension}
        </div>

        {/* Drag Handle Overlay */}
        {!isSelectionMode && !isOverlay && (
          <div
            {...listeners}
            {...attributes}
            className="absolute inset-0 z-20 flex cursor-grab items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          >
            <Icon name="drag_indicator" className="text-foreground/50 size-8" />
          </div>
        )}

        {/* Selection Checkmark */}
        {isSelectionMode && (
          <div className="absolute top-3 left-3 z-30">
            <div
              className={cn(
                "flex size-6 items-center justify-center rounded-full border-2 transition-all",
                isSelected ? "bg-primary border-primary" : "border-border bg-black/40",
              )}
            >
              {isSelected && <Icon name="security" className="size-4 stroke-[3] text-slate-950" />}
            </div>
          </div>
        )}

        {/* Status Badges */}
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
          {item.isHero && (
            <div className="flex animate-pulse items-center gap-1 rounded-md bg-amber-500 px-2 py-1 text-[8px] font-black text-slate-950 uppercase shadow-lg">
              <Icon name="star" className="size-3 fill-current" />
              Hero
            </div>
          )}
          {item.isCardBackground && (
            <div className="flex items-center gap-1 rounded-md bg-cyan-500 px-2 py-1 text-[8px] font-black text-slate-950 uppercase shadow-lg">
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
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="absolute right-3 bottom-3 z-30 size-8 rounded-xl opacity-60 transition-all group-hover:opacity-100 focus-visible:opacity-100"
            aria-label="Delete media"
          >
            <Icon name="delete" className="size-4" />
          </Button>
        )}
      </div>

      {/* 🛠️ Action Controls (Below Thumbnail) */}
      {!isOverlay && (
        <div className="bg-muted/10 border-border/50 grid grid-cols-3 gap-2 border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleHero}
            className={cn(
              "flex h-auto flex-col gap-1 py-2 text-[9px] font-black tracking-tighter uppercase hover:bg-amber-500/10",
              item.isHero ? "text-amber-500" : "text-muted-foreground",
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
              "flex h-auto flex-col gap-1 py-2 text-[9px] font-black tracking-tighter uppercase hover:bg-cyan-500/10",
              item.isCardBackground ? "text-cyan-500" : "text-muted-foreground",
            )}
          >
            <Icon
              name="dashboard"
              className={cn("size-4", item.isCardBackground && "fill-current")}
            />
            Card BG
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVisibility}
            className={cn(
              "hover:bg-primary/10 flex h-auto flex-col gap-1 py-2 text-[9px] font-black tracking-tighter uppercase",
              item.isGalleryVisible ? "text-emerald-500" : "text-muted-foreground",
            )}
          >
            {item.isGalleryVisible ? (
              <Icon name="visibility" className="size-4" />
            ) : (
              <Icon name="visibility_off" className="size-4" />
            )}
            {item.isGalleryVisible ? "Public" : "Hidden"}
          </Button>
        </div>
      )}

      {/* ✍️ Inline Caption Editor */}
      {!isOverlay && !isSelectionMode && (
        <div className="flex items-center gap-2 bg-white/[0.01] px-3 pb-1">
          {/* Filename badge */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <Icon name="insert_drive_file" className="text-muted-foreground/50 size-3 shrink-0" />
            <span className="text-muted-foreground/70 min-w-0 truncate font-mono text-[10px]">
              {filenameFromBlobUrl(item.url)}.{extension.toLowerCase()}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRename}
              className="text-muted-foreground/50 hover:text-foreground h-5 shrink-0 rounded-md px-1.5 text-[9px] font-bold tracking-wider uppercase"
            >
              <Icon name="edit" className="mr-0.5 size-2.5" />
              Preimenuj
            </Button>
          </div>
        </div>
      )}

      {/* ✍️ Inline Caption Editor */}
      {!isOverlay && !isSelectionMode && (
        <div className="flex items-center gap-2 bg-white/[0.01] px-3 pt-1 pb-3">
          <input
            type="text"
            placeholder="Add descriptive SEO ALT tag..."
            aria-label="Image caption"
            key={item.caption || ""}
            defaultValue={item.caption || ""}
            onFocus={() => onUnsavedEdit?.(true)}
            onBlur={async (e) => {
              const val = e.target.value.trim() || null;
              if (val === item.caption) {
                onUnsavedEdit?.(false);
                return;
              }
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
            className="border-border/50 text-foreground/80 focus:border-ring placeholder:text-muted-foreground/80 w-full rounded-lg border bg-black/20 px-2.5 py-1 text-[10px] font-medium transition-colors focus:outline-none"
          />
          {item.type === "PHOTO" && (
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleFocalPoint?.()}
                className={cn(
                  "border-border/50 size-7 rounded-lg border transition-colors hover:bg-cyan-500/10 hover:text-cyan-400",
                  item.originalUrl
                    ? "border-cyan-500/20 bg-cyan-500/5 text-cyan-400"
                    : "text-muted-foreground",
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
                className="text-muted-foreground border-border/50 size-7 rounded-lg border transition-colors hover:bg-cyan-500/10 hover:text-cyan-400"
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
  );
}

export { MediaItemCard };
