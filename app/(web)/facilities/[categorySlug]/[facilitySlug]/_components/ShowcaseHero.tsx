"use client";
import { Icon } from "@/components/ui/Icon";

import type { FacilityMedia } from "@prisma/client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ShowcaseHeroProps {
  heroMedia: FacilityMedia | null;
  facility: {
    id: string;
    name: string;
  };
}

/**
 * 🏔️ ShowcaseHero Island (Client)
 * Saturates native Browser APIs to pause rendering loops on tab-blur
 * and auto-suppress HD loops on constrained Save-Data networks.
 */
export function ShowcaseHero({ heroMedia, facility }: ShowcaseHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [allowHDMedia, setAllowHDMedia] = useState(true);

  useEffect(() => {
    // 📡 Network Information API: Defer HD loading on constrained data connections
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const conn = (navigator as any).connection;
      if (conn && (conn.saveData || conn.effectiveType === "2g" || conn.effectiveType === "slow-2g")) {
        Promise.resolve().then(() => setAllowHDMedia(false));
      }
    }

    // 👁️ Page Visibility API: Pause JS-Physics/Media pipelines when tab loses focus
    const handleVisibility = () => {
      if (!videoRef.current) return;
      if (document.hidden) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {}); // Ignore user interaction blockages
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const renderMedia = () => {
    if (!heroMedia) {
      return (
         <div className="w-full h-full bg-gradient-to-br from-navy-deep to-[#0f172a] flex items-center justify-center">
           <Icon name="waves" className="w-48 h-48 text-cyan-900 animate-pulse" />
         </div>
      );
    }

    const isVideo = heroMedia.type === "VIDEO" && allowHDMedia;

    if (isVideo) {
      return (
        <div className="relative w-full h-full">
          {heroMedia.thumbnailUrl && (
            <Image
              src={heroMedia.thumbnailUrl}
              alt={`${facility.name} poster`}
              fill
              priority
              sizes="100vw"
              className="object-cover brightness-75 pointer-events-none"
            />
          )}
          <video 
            ref={videoRef}
            autoPlay 
            loop 
            muted 
            playsInline 
            {...{ fetchPriority: "high" } as any}
            className="absolute inset-0 w-full h-full object-cover brightness-75 transition-all duration-700 pointer-events-none z-10"
            poster={heroMedia.thumbnailUrl || undefined}
          >
            <source src={heroMedia.url} type="video/mp4" />
          </video>
        </div>
      );
    }

    // PHOTO type — render the photo URL directly
    if (heroMedia.type === "PHOTO") {
      return (
        <div className="relative w-full h-full">
          <Image 
            src={heroMedia.url} 
            alt={facility.name}
            fill
            priority
            sizes="100vw"
            className="object-cover brightness-75 transition-all duration-700"
          />
        </div>
      );
    }

    // VIDEO type but allowHDMedia=false → show thumbnail instead of mp4 URL
    const fallbackSrc = heroMedia.thumbnailUrl || null;
    if (!fallbackSrc) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-navy-deep to-[#0f172a] flex items-center justify-center">
          <Icon name="waves" className="w-48 h-48 text-cyan-900 animate-pulse" />
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        <Image 
          src={fallbackSrc} 
          alt={facility.name}
          fill
          priority
          sizes="100vw"
          className="object-cover brightness-75 transition-all duration-700"
        />
      </div>
    );
  };

  return (
    <div
      className="absolute inset-0 z-0 bg-navy-deep"
    >
      {renderMedia()}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/20 to-transparent shadow-[inset_0_-100px_100px_rgba(2,6,23,0.8)]" />
      <div className="absolute inset-x-0 bottom-0 h-[20%] splash-gradient opacity-20 blur-3xl pointer-events-none" />
    </div>
  )
}

export interface CurrentWeather {
  temperature: number;
  weathercode: number;
  time?: string;
  is_day?: number;
}

/**
 * 🌤️ WeatherBadge Island (Client)
 * Minimal interactive component for real-time status visibility.
 */
export function WeatherBadge({ weather }: { weather: CurrentWeather | null }) {
  if (!weather) return null;
  
  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Icon name="light_mode" className="text-[20px] text-amber-400" />
    if (code < 4) return <Icon name="cloud" className="text-[20px] text-slate-300" />
    return <Icon name="rainy" className="text-[20px] text-primary" />
  }

  return (
    <div
      className="flex items-center gap-3 glass-frost px-4 py-2 rounded-full border-border shadow-xl"
    >
      {getWeatherIcon(weather.weathercode)}
      <span className="text-sm font-black whitespace-nowrap text-white">
         {Math.round(weather.temperature)}°C
      </span>
      <div className="hidden md:block h-4 w-px bg-white/10" />
      <span className="hidden md:inline text-xs uppercase font-bold text-slate-400 tracking-widest">
         Idealno za kupanje
      </span>
    </div>
  )
}
