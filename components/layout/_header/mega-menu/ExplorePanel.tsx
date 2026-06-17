"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { CityGrid } from "./CityGrid";


interface FeaturedFacility {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  canonicalPath: string;
  imageUrl: string;
  startingPrice: number | null;
  description: string;
}

interface ExplorePanelProps {
  featured: FeaturedFacility | null;
  cities: { id: string; name: string; slug: string }[];
  loading: boolean;
  dict: any;
  onClose: () => void;
}

export function ExplorePanel({
  featured,
  cities,
  loading,
  dict,
  onClose,
}: ExplorePanelProps) {
  return (
    <div className="grid grid-cols-12 gap-10 items-stretch">
      {/* Visual Promo Showcase (Col 1-4) */}
      <div className="col-span-4 flex min-h-[320px]">
        {featured ? (
          <Link
            href={featured.canonicalPath}
            onClick={onClose}
            className="w-full flex flex-col justify-end p-6 rounded-[1.75rem] overflow-hidden relative group/promo border border-white/5 hover:border-cyan-500/30 transition-all duration-500 shadow-2xl"
          >
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-10 transition-all duration-500 group-hover/promo:via-slate-950/40" />
              {featured.imageUrl.endsWith(".mp4") ? (
                <video
                  src={featured.imageUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-105 group-hover/promo:scale-100 transition-transform duration-700 blur-[0.5px]"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.imageUrl}
                  alt={featured.name}
                  className="w-full h-full object-cover scale-105 group-hover/promo:scale-100 transition-transform duration-700"
                />
              )}
            </div>

            <div className="relative z-20 space-y-4">
              <div className="flex justify-between items-start gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)] leading-none">
                  Hit Ponuda
                </span>
                {featured.startingPrice && (
                  <span className="text-white text-sm font-black bg-slate-950/70 border border-white/5 px-3 py-1.5 rounded-lg backdrop-blur-md">
                    od{" "}
                    <span className="text-cyan-400 text-base">
                      {featured.startingPrice} RSD
                    </span>
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-black italic uppercase tracking-tight text-white leading-tight">
                  {featured.name}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium opacity-90 line-clamp-2">
                  {featured.description}
                </p>
              </div>

              <div className="w-full h-11 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg group-hover/promo:bg-white transition-all duration-300">
                <Icon name="local_fire_department" className="text-[16px] animate-pulse" />{" "}
                Kupi Karte
              </div>
            </div>
          </Link>
        ) : (
          <div className="w-full bg-white/[0.02] border border-dashed border-white/10 rounded-[1.75rem] flex flex-col items-center justify-center p-8 text-center">
            <Icon
              name="auto_awesome"
              className="text-[40px] text-slate-600 mb-3 animate-pulse"
            />
            <span className="text-sm font-bold text-slate-400">
              Splashdeals Premium
            </span>
          </div>
        )}
      </div>

      {/* Cities Grid (Col 5-10) */}
      <div className="col-span-6 flex flex-col gap-5">
        <CityGrid cities={cities} loading={loading} onCityClick={onClose} dict={dict} />
      </div>

      {/* Categories Links (Col 11-12) */}
      <div className="col-span-2 flex flex-col justify-between border-l border-white/5 pl-9">
        <div className="space-y-1">
          <div className="border-b border-white/5 pb-4 mb-3">
            <span className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">
              Kategorije
            </span>
          </div>

          <div className="flex flex-col">
            {[
              {
                href: "/facilities/waterpark",
                icon: "waves",
                label: "Akva Parkovi",
                cls: "group-hover/link:animate-bounce",
              },
              {
                href: "/facilities/swimming-pool",
                icon: "waves",
                label: "Bazeni",
                cls: "group-hover/link:animate-pulse",
              },
              {
                href: "/facilities/wellness",
                icon: "auto_awesome",
                label: "Wellness & Spa",
                cls: "group-hover/link:animate-spin",
              },
            ].map(({ href, icon: iconName, label, cls }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 py-3.5 text-sm font-black italic uppercase tracking-wide text-slate-300 hover:text-cyan-400 transition-colors group/link cursor-pointer"
              >
                <Icon name={iconName} className={cn("text-[20px] text-cyan-500", cls)} />
                <span>{label}</span>
              </Link>
            ))}

            <Link
              href="/#deals"
              onClick={onClose}
              className="flex items-center gap-3 py-3.5 text-sm font-black italic uppercase tracking-wide text-cyan-400 hover:text-white transition-colors group/link cursor-pointer"
            >
              <Icon name="local_fire_department" className="text-[20px] text-cyan-400" />
              <span>Sve Akcije</span>
            </Link>
          </div>
        </div>

        <div className="pt-5 border-t border-white/5">
          <Link
            href="/support"
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <Icon name="help" className="text-[16px] text-slate-600" />
            <span>Korisnička Pomoć</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
