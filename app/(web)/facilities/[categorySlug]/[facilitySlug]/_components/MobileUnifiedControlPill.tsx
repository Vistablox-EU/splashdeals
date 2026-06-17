"use client";
import { Icon } from "@/components/ui/Icon";

import { useEffect, useState } from "react";
import { formatTime24h } from "@/lib/utils/date-time";
import type { OperatingHours } from "@prisma/client";

interface CurrentWeather {
  temperature: number;
  weathercode: number;
}

interface MobileUnifiedControlPillProps {
  weather: CurrentWeather | null;
  hours: OperatingHours[];
  destLat: number;
  destLng: number;
}

export function MobileUnifiedControlPill({
  weather,
  hours = [],
  destLat,
  destLng,
}: MobileUnifiedControlPillProps) {
  const [todayHours, setTodayHours] = useState<OperatingHours | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // ⏰ Operating hours logic
  useEffect(() => {
    const todayId = new Date().getDay();
    const today = hours?.find?.((h) => h.dayOfWeek === todayId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (today) setTodayHours(today);
  }, [hours]);

  // 🧭 Geolocation distance calculation (Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth Radius in KM
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Run distance calculation silently on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const dist = calculateDistance(userLat, userLng, destLat, destLng);
          setDistance(dist);
        },
        (err) => {
          console.warn("Silent geolocation fetch failed:", err);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, [destLat, destLng]);

  // 🗺️ Direct Map redirection (opens native Google Maps or Apple Maps)
  const handleNavigation = () => {
    if ("vibrate" in navigator) navigator.vibrate(15);
    
    const isApple =
      typeof navigator !== "undefined" &&
      /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
    
    const url = isApple
      ? `maps://maps.google.com/maps?daddr=${destLat},${destLng}&amp;ll=`
      : `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;

    window.open(url, "_blank");
  };

  // 🌤️ Weather icon matcher
  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Icon name="light_mode" className="text-[24px] text-amber-400" />;
    if (code < 4) return <Icon name="cloud" className="text-[24px] text-slate-300" />;
    return <Icon name="rainy" className="text-[24px] text-cyan-400" />;
  };

  return (
    <div
      className="flex items-center justify-between w-full max-w-md mx-auto h-16 bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-full px-5 shadow-2xl relative select-none animate-fade-in-up"
    >
      {/* 🌤️ Segment 1: Weather */}
      <div className="flex items-center gap-2.5 px-2 flex-1 justify-center">
        {weather ? (
          <>
            {getWeatherIcon(weather.weathercode)}
            <span className="text-base font-black text-white tracking-tight font-sans">
              {Math.round(weather.temperature)}°C
            </span>
          </>
        ) : (
          <Icon name="cloud" className="text-[24px] text-slate-400 animate-pulse" />
        )}
      </div>

      {/* Separator 1 */}
      <div className="w-px h-7 bg-white/10 self-center" />

      {/* ⏰ Segment 2: Operating Hours */}
      <div className="flex items-center gap-2.5 px-3 flex-1 justify-center">
        <Icon name="schedule" className="text-[24px] text-cyan-400 flex-shrink-0" />
        <span className="text-base font-black text-white tracking-tight font-mono">
          {todayHours ? (
            todayHours.isClosed ? (
              <span className="text-red-400">Zatvoreno</span>
            ) : (
              `${formatTime24h(todayHours.openTime)}–${formatTime24h(
                todayHours.closeTime
              )}`
            )
          ) : (
            <span className="opacity-40">--:--</span>
          )}
        </span>
      </div>

      {/* Separator 2 */}
      <div className="w-px h-7 bg-white/10 self-center" />

      {/* 🧭 Segment 3: Navigation Trigger */}
      <button
        onClick={handleNavigation}
        className="flex items-center gap-2 px-3 flex-1 justify-center h-full text-cyan-400 hover:text-cyan-300 transition-colors active:scale-95 active:opacity-80 group cursor-pointer"
      >
        <Icon name="navigation" className="text-[24px] fill-current animate-pulse text-cyan-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
        {distance !== null ? (
          <span className="text-sm font-black tracking-tight text-white font-mono">
            {distance.toFixed(0)} km
          </span>
        ) : (
          <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400/80 group-hover:text-cyan-400">
            Ruta
          </span>
        )}
      </button>
    </div>
  );
}
