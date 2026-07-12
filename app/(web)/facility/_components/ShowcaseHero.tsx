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
      const conn = (
        navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }
      ).connection;
      if (
        conn &&
        (conn.saveData || conn.effectiveType === "2g" || conn.effectiveType === "slow-2g")
      ) {
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
        <div className="from-background to-background flex h-full w-full items-center justify-center bg-gradient-to-br">
          <Icon name="waves" className="text-foreground h-48 w-48 animate-pulse" />
        </div>
      );
    }

    const isVideo = heroMedia.type === "VIDEO" && allowHDMedia;

    if (isVideo) {
      return (
        <div className="relative h-full w-full">
          {heroMedia.thumbnailUrl && (
            <Image
              src={heroMedia.thumbnailUrl}
              alt={`${facility.name} poster`}
              fill
              priority
              sizes="100vw"
              className="pointer-events-none object-cover brightness-75"
            />
          )}
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            {...{ fetchPriority: "high" as const }}
            className="pointer-events-none absolute inset-0 z-10 h-full w-full object-cover brightness-75 transition-[filter] duration-700"
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
        <div className="relative h-full w-full">
          <Image
            src={heroMedia.url}
            alt={facility.name}
            fill
            priority
            sizes="100vw"
            className="object-cover brightness-75 transition-[filter] duration-700"
          />
        </div>
      );
    }

    // VIDEO type but allowHDMedia=false → show thumbnail instead of mp4 URL
    const fallbackSrc = heroMedia.thumbnailUrl || null;
    if (!fallbackSrc) {
      return (
        <div className="from-background to-background flex h-full w-full items-center justify-center bg-gradient-to-br">
          <Icon name="waves" className="text-foreground h-48 w-48 animate-pulse" />
        </div>
      );
    }

    return (
      <div className="relative h-full w-full">
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
    <div className="bg-background absolute inset-0 z-0">
      {renderMedia()}
      <div className="from-background via-background/20 absolute inset-0 bg-gradient-to-t to-transparent" />
      <div className="splash-gradient pointer-events-none absolute inset-x-0 bottom-0 h-[20%] opacity-20 blur-3xl" />
    </div>
  );
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
    if (code === 0) return <Icon name="light_mode" className="text-primary text-[20px]" />;
    if (code < 4) return <Icon name="cloud" className="text-muted-foreground text-[20px]" />;
    return <Icon name="rainy" className="text-primary text-[20px]" />;
  };

  return (
    <div className="glass-frost border-border flex items-center gap-3 rounded-full px-4 py-2 shadow-xl">
      {getWeatherIcon(weather.weathercode)}
      <span className="text-primary-foreground text-sm font-black whitespace-nowrap">
        {Math.round(weather.temperature)}°C
      </span>
      <div className="bg-border hidden h-4 w-px md:block" />
      <span className="text-muted-foreground hidden text-xs font-bold tracking-widest uppercase md:inline">
        Idealno za kupanje
      </span>
    </div>
  );
}
