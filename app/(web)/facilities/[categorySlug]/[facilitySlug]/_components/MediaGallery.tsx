"use client";
import { Icon } from "@/components/ui/Icon";

import { useState } from "react";
import Image from "next/image";
import type { FacilityMedia } from "@prisma/client";
import { cn } from "@/lib/utils";

interface MediaGalleryProps {
  media: FacilityMedia[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict?: any;
}

/**
 * 📷 MediaGallery Island (Client)
 * Handles full-screen previews and high-energy interactive masonry grid.
 */
export function MediaGallery({ media, dict }: MediaGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const galleryMedia = media.filter(m => (m as any).isGalleryVisible !== false);

  if (!galleryMedia.length) return null;

  return (
    <section id="gallery" className="space-y-12">
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 text-primary font-extrabold uppercase tracking-widest text-xs">
              <Icon name="photo_camera" className="text-[16px]" />
              {dict?.media_gallery?.eyebrow || "Galerija"}
          </div>
          <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-white">
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
          <p className="text-muted-foreground font-medium">Uronite u atmosferu naše destinacije kroz objektiv naših posetilaca.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[250px]">
          {galleryMedia.map((m: FacilityMedia, i: number) => (
            <div
              key={m.id}
              onClick={() => setSelectedIdx(i)}
              className="relative group rounded-[2.5rem] overflow-hidden bg-white/[0.02] border border-border cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}
            >
              {m.type === "VIDEO" ? (
                <div className="w-full h-full relative">
                  <video 
                    src={m.url} 
                    muted 
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Icon name="play_arrow" className="text-[48px] text-white/80 fill-white/20 backdrop-blur-sm p-3 rounded-full border border-border/20" />
                  </div>
                </div>
              ) : (
                <Image 
                  src={m.url} 
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1" 
                  alt={m.caption || "Facility media"} 
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-8 flex flex-col justify-end">
                <div className="space-y-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <p className="font-bold text-white text-lg">{m.caption || (dict?.media_gallery?.fallback_caption || "Letnji Užitak")}</p>
                    <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
                      <Icon name="open_in_full" className="text-[16px]" />
                      {m.type === "VIDEO" 
                        ? (dict?.media_gallery?.play_video || "Pusti Video") 
                        : (dict?.media_gallery?.expand_view || "Prikaži Veće")}
                    </div>
                </div>
                <div className="absolute top-6 right-6 p-3 rounded-full bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                    <Icon name="favorite" className="text-[20px] text-white hover:text-red-500 cursor-pointer transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 🎭 LIGHTBOX */}
        {selectedIdx !== null && (
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-navy-deep/95 backdrop-blur-2xl p-4 md:p-20 animate-fade-in"
            onClick={() => setSelectedIdx(null)}
          >
            <button
              className="absolute top-8 right-8 z-[2010] p-4 rounded-full bg-white/5 border border-border text-white hover:bg-white/10"
              onClick={() => setSelectedIdx(null)}
            >
              <Icon name="close" className="text-[24px]" />
            </button>

            <div
              className="relative max-w-6xl w-full aspect-video rounded-[3rem] overflow-hidden shadow-2xl border border-border bg-black animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
                {galleryMedia[selectedIdx].type === "VIDEO" ? (
                  <video
                    src={galleryMedia[selectedIdx].url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image
                    src={galleryMedia[selectedIdx].url}
                    fill
                    sizes="100vw"
                    className="w-full h-full object-contain"
                    alt={galleryMedia[selectedIdx].caption || "Expanded view"}
                  />
                )}
                {galleryMedia[selectedIdx].caption && (
                  <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white font-black text-2xl uppercase italic tracking-tighter">
                      {galleryMedia[selectedIdx].caption}
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}
      </section>
  );
}

/**
 * 🎞️ HeroThumbnails Island (Client)
 * Minimal thumbnail switcher for the immersive hero background.
 */
export function HeroThumbnails({ media }: { media: FacilityMedia[] }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const visibleMedia = media.filter(m => (m as any).isGalleryVisible !== false);
  
  return (
    <div className="flex p-2 gap-2 overflow-x-auto no-scrollbar">
      {visibleMedia.slice(0, 4).map((m: FacilityMedia, idx: number) => (
        <button 
          key={m.id}
          onClick={() => setActiveIdx(idx)}
          className={cn(
            "relative h-20 w-32 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300",
            activeIdx === idx ? "ring-2 ring-cyan-500 scale-105" : "opacity-60 grayscale hover:grayscale-0"
          )}
        >
          {m.type === 'VIDEO' ? (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              {m.thumbnailUrl ? (
                <Image 
                  src={m.thumbnailUrl} 
                  fill
                  sizes="128px"
                  className="w-full h-full object-cover opacity-50" 
                  alt="Video thumbnail" 
                />
              ) : (
                <video src={m.url} muted className="w-full h-full object-cover opacity-50" />
              )}
              <Icon name="play_arrow" className="absolute inset-0 m-auto text-[24px] text-white" />
            </div>
          ) : (
            <Image 
              src={m.url} 
              fill
              sizes="128px"
              className="w-full h-full object-cover" 
              alt="Media thumbnail" 
            />
          )}
        </button>
      ))}
    </div>
  )
}
