"use client";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { FacilityMedia } from "@prisma/client";

import { Dict } from "@/lib/types";

interface MediaGalleryProps {
  media: FacilityMedia[];
  dict?: Dict;
}

/**
 * 📷 MediaGallery Island (Client)
 * Handles full-screen previews and high-energy interactive masonry grid.
 */
export function MediaGallery({ media, dict }: MediaGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const galleryMedia = media.filter((m) => m.isGalleryVisible !== false);

  // Keyboard: Escape closes the lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIdx(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!galleryMedia.length) return null;

  return (
    <section id="gallery" className="space-y-12">
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <div className="text-primary flex items-center justify-center gap-3 text-xs font-extrabold tracking-widest uppercase">
          <Icon name="photo_camera" className="text-[16px]" />
          {dict?.media_gallery?.eyebrow || "Galerija"}
        </div>
        <h2 className="text-primary-foreground text-3xl leading-none font-black tracking-tighter uppercase italic md:text-5xl">
          {(() => {
            const fullTitle = dict?.media_gallery?.title || "Doživite Atmosferu";
            const words = fullTitle.split(" ");
            if (words.length > 1) {
              return (
                <>
                  {words.slice(0, -1).join(" ")}{" "}
                  <span className="text-splash">{words[words.length - 1]}</span>
                </>
              );
            }
            return fullTitle;
          })()}
        </h2>
        <p className="text-muted-foreground font-medium">
          {dict?.media_gallery?.description ||
            "Uronite u atmosferu naše destinacije kroz objektiv naših posetilaca."}
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl auto-rows-[180px] grid-cols-2 gap-2 sm:gap-4 md:auto-rows-[250px] md:grid-cols-4">
        {galleryMedia.map((m: FacilityMedia, i: number) => (
          <button
            key={m.id}
            onClick={() => setSelectedIdx(i)}
            className="group border-border animate-fade-in-up bg-muted/5 relative overflow-hidden rounded-2xl border md:rounded-[2.5rem]"
            style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}
            aria-label={`${dict?.media_gallery?.expand_view} ${i + 1}`}
          >
            {m.type === "VIDEO" ? (
              <div className="relative h-full w-full">
                <video
                  src={m.url}
                  poster={m.thumbnailUrl || undefined}
                  muted
                  preload="none"
                  className="h-full w-full object-cover transition-[transform] duration-1000 group-hover:scale-110"
                />
                <div className="bg-background/20 absolute inset-0 flex items-center justify-center">
                  <Icon
                    name="play_arrow"
                    className="border-border/20 rounded-full border fill-white/20 p-3 text-[48px] text-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>
            ) : (
              <Image
                src={m.url}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="h-full w-full object-cover transition-[transform] duration-1000 group-hover:scale-110 group-hover:rotate-1"
                alt={m.caption || "Facility media"}
                loading={i < 2 ? "eager" : "lazy"}
                priority={i < 2}
              />
            )}
            <div className="from-background/90 absolute inset-0 flex flex-col justify-end bg-gradient-to-t via-transparent to-transparent p-8 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="translate-y-4 space-y-2 transition-transform duration-500 group-hover:translate-y-0">
                <p className="text-primary-foreground text-lg font-bold">
                  {m.caption || dict?.media_gallery?.fallback_caption || "Letnji Užitak"}
                </p>
                <div className="text-primary flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                  <Icon name="open_in_full" className="text-[16px]" />
                  {m.type === "VIDEO"
                    ? dict?.media_gallery?.play_video || "Pusti Video"
                    : dict?.media_gallery?.expand_view || "Prikaži Veće"}
                </div>
              </div>
              <div className="bg-muted/20 absolute top-6 right-6 scale-75 rounded-full p-3 opacity-0 backdrop-blur-md transition-[transform,opacity] group-hover:scale-100 group-hover:opacity-100">
                <Icon
                  name="favorite"
                  className="text-primary-foreground hover:text-destructive cursor-pointer text-[20px] transition-colors"
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 🎭 LIGHTBOX */}
      {selectedIdx !== null && (
        <button
          className="bg-background/95 animate-fade-in fixed inset-0 z-[2000] flex items-center justify-center p-4 backdrop-blur-2xl md:p-20"
          onClick={() => setSelectedIdx(null)}
          aria-label={dict?.media_gallery?.close || "Zatvori galeriju"}
        >
          <Button
            variant="ghost"
            size="icon"
            className="border-border bg-muted/20 text-muted-foreground hover:bg-muted/30 absolute top-8 right-8 z-[2010] rounded-full border"
            onClick={() => setSelectedIdx(null)}
            aria-label={dict?.media_gallery?.close || "Zatvori galeriju"}
          >
            <Icon name="close" className="text-[24px]" />
          </Button>

          <div
            className="border-border animate-scale-in bg-background relative aspect-video w-full max-w-6xl overflow-hidden rounded-[3rem] border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {galleryMedia[selectedIdx].type === "VIDEO" ? (
              <video
                src={galleryMedia[selectedIdx].url}
                controls
                autoPlay
                className="h-full w-full object-contain"
              />
            ) : (
              <Image
                src={galleryMedia[selectedIdx].url}
                fill
                sizes="100vw"
                className="h-full w-full object-contain"
                alt={galleryMedia[selectedIdx].caption || "Expanded view"}
              />
            )}
            {galleryMedia[selectedIdx].caption && (
              <div className="from-background/80 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent p-8">
                <p className="text-primary-foreground text-2xl font-black tracking-tighter uppercase italic">
                  {galleryMedia[selectedIdx].caption}
                </p>
              </div>
            )}
          </div>
        </button>
      )}
    </section>
  );
}
