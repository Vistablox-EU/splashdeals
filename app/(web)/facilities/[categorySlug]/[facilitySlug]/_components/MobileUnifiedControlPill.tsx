"use client";
import { Icon } from "@/components/ui/Icon";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatTime24h } from "@/lib/utils/date-time";
import type { OperatingHours } from "@prisma/client";

interface CurrentWeather {
  temperature: number;
  weathercode: number;
}

export interface DailyForecastItem {
  day: string;
  weathercode: number;
  tempHigh: number;
  tempLow: number;
}

interface MobileUnifiedControlPillProps {
  weather: CurrentWeather | null;
  dailyForecast?: DailyForecastItem[] | null;
  hours: OperatingHours[];
  destLat: number;
  destLng: number;
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Vedro",
  1: "Pretežno vedro",
  2: "Delimično oblačno",
  3: "Oblačno",
  45: "Maglovito",
  48: "Magla",
  51: "Sitna kiša",
  53: "Sitna kiša",
  55: "Sitna kiša",
  56: "Ledena kiša",
  57: "Ledena kiša",
  61: "Kiša",
  63: "Kiša",
  65: "Jaka kiša",
  66: "Ledena kiša",
  67: "Ledena kiša",
  71: "Sneg",
  73: "Sneg",
  75: "Jak sneg",
  77: "Zrnca snega",
  80: "Pljuskovi",
  81: "Pljuskovi",
  82: "Jaki pljuskovi",
  85: "Snežni pljuskovi",
  86: "Snežni pljuskovi",
  95: "Oluja",
  96: "Oluja sa gradom",
  99: "Oluja sa gradom",
};

export function MobileUnifiedControlPill({
  weather,
  dailyForecast,
  hours = [],
  destLat,
  destLng,
}: MobileUnifiedControlPillProps) {
  const [geoState, setGeoState] = useState<{ distance: number | null; failed: boolean }>({
    distance: null,
    failed: false,
  });
  const [forecastOpen, setForecastOpen] = useState(false);
  const geoTimeoutRef = useRef<number | null>(null);

  // ⏰ Derived hours + open/closed status
  const todayInfo = useMemo(() => {
    const todayId = new Date().getDay();
    const today = hours?.find?.((h) => h.dayOfWeek === todayId);
    if (!today) return { todayHours: null, isOpen: null };

    let openNow: boolean | null = null;
    if (!today.isClosed && today.openTime && today.closeTime) {
      const now = new Date();
      const [openH, openM] = today.openTime.split(":").map(Number);
      const [closeH, closeM] = today.closeTime.split(":").map(Number);
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      openNow = nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
    } else {
      openNow = false;
    }

    return { todayHours: today, isOpen: openNow };
  }, [hours]);
  const { todayHours, isOpen } = todayInfo;
  const { distance, failed: geoError } = geoState;

  // 🧭 Geolocation (Haversine) with timeout fallback
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      geoTimeoutRef.current = window.setTimeout(() => {
        setGeoState({ distance: null, failed: true });
      }, 8000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (geoTimeoutRef.current !== null) window.clearTimeout(geoTimeoutRef.current);
          const R = 6371;
          const dLat = (position.coords.latitude - destLat) * (Math.PI / 180);
          const dLon = (position.coords.longitude - destLng) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(destLat * (Math.PI / 180)) *
              Math.cos(position.coords.latitude * (Math.PI / 180)) *
              Math.sin(dLon / 2) ** 2;
          setGeoState({ distance: R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), failed: false });
        },
        () => {
          if (geoTimeoutRef.current !== null) window.clearTimeout(geoTimeoutRef.current);
          setGeoState({ distance: null, failed: true });
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      Promise.resolve().then(() => setGeoState({ distance: null, failed: true }));
    }
    return () => {
      if (geoTimeoutRef.current !== null) window.clearTimeout(geoTimeoutRef.current);
    };
  }, [destLat, destLng]);

  // 🗺️ Navigation trigger
  const handleNavigation = () => {
    if ("vibrate" in navigator) navigator.vibrate(15);
    const isApple =
      typeof navigator !== "undefined" &&
      /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
    const url = isApple
      ? `maps://maps.google.com/maps?daddr=${destLat},${destLng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
    window.open(url, "_blank");
  };

  // 🌤️ Weather icon + description
  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Icon name="light_mode" className="text-[24px] text-amber-400" />;
    if (code < 4) return <Icon name="cloud" className="text-[24px] text-slate-300" />;
    if (code >= 95) return <Icon name="bolt" className="text-[24px] text-purple-400" />;
    if (code >= 61) return <Icon name="water_drop" className="text-[24px] text-primary" />;
    if (code >= 51) return <Icon name="water_drop" className="text-[24px] text-primary" />;
    if (code >= 45) return <Icon name="cloud_off" className="text-[24px] text-slate-400" />;
    return <Icon name="cloud" className="text-[24px] text-slate-400" />;
  };

  const getSmallWeatherIcon = (code: number) => {
    if (code === 0) return <Icon name="light_mode" className="text-[14px] text-amber-400" />;
    if (code < 4) return <Icon name="cloud" className="text-[14px] text-slate-400" />;
    if (code >= 95) return <Icon name="bolt" className="text-[14px] text-purple-400" />;
    if (code >= 61) return <Icon name="water_drop" className="text-[14px] text-primary" />;
    return <Icon name="water_drop" className="text-[14px] text-primary" />;
  };

  const weatherDescription = weather ? WMO_DESCRIPTIONS[weather.weathercode] ?? "" : "";

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="mobile-glass flex items-center justify-between w-full h-16 rounded-full px-4 shadow-2xl relative select-none border-primary/10"
      >
        {/* 🌤️ Segment 1: Weather (tappable → toggle forecast) */}
        <button
          onClick={() => setForecastOpen(!forecastOpen)}
          className="flex items-center gap-1.5 px-2 flex-[1.3] justify-center h-full transition-colors active:scale-95 origin-center"
          aria-label={weather ? `Trenutno ${Math.round(weather.temperature)}°C, ${weatherDescription}. Dodirni za prognozu.` : "Trenutno vreme"}
        >
          {weather ? (
            <>
              {getWeatherIcon(weather.weathercode)}
              <div className="flex flex-col items-start leading-tight -space-y-0.5">
                <span className="text-base font-black text-foreground tracking-tight">
                  {Math.round(weather.temperature)}°C
                </span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                  {weatherDescription}
                </span>
              </div>
              <Icon
                name={forecastOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                className="text-[12px] text-muted-foreground/50 ml-0.5 transition-transform duration-200"
              />
            </>
          ) : (
            <Icon name="cloud" className="text-[24px] text-slate-400 animate-pulse" />
          )}
        </button>

        {/* Separator 1 */}
        <div className="w-px h-6 bg-border/30 self-center shrink-0" />

        {/* ⏰ Segment 2: Operating Hours */}
        <div
          className="flex items-center gap-1.5 px-2 flex-[1.3] justify-center"
          aria-label={
            todayHours
              ? todayHours.isClosed
                ? "Zatvoreno danas"
                : `Radno vreme: ${formatTime24h(todayHours.openTime)} – ${formatTime24h(todayHours.closeTime)}`
              : "Radno vreme nije dostupno"
          }
        >
          <div className="relative shrink-0">
            <Icon name="schedule" className="text-[22px] text-muted-foreground" />
            {isOpen === true && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            )}
          </div>
          <div className="flex flex-col items-start leading-tight -space-y-0.5">
            {todayHours ? (
              todayHours.isClosed ? (
                <span className="text-sm font-black text-red-400 tracking-tight">Zatvoreno</span>
              ) : (
                <>
                  <span className="text-sm font-black text-foreground tracking-tight">
                    {isOpen ? "Otvoreno" : "Zatvoreno"}
                  </span>
                  <span className="text-[8px] font-bold text-muted-foreground tracking-tight leading-none">
                    {formatTime24h(todayHours.openTime)}–{formatTime24h(todayHours.closeTime)}
                  </span>
                </>
              )
            ) : (
              <span className="text-sm font-black text-muted-foreground tracking-tight">--:--</span>
            )}
          </div>
        </div>

        {/* Separator 2 */}
        <div className="w-px h-6 bg-border/30 self-center shrink-0" />

        {/* 🧭 Segment 3: Navigation */}
        <button
          onClick={handleNavigation}
          className="flex items-center gap-1.5 px-2 flex-1 justify-center h-full text-foreground hover:text-primary transition-colors active:scale-90 origin-center group cursor-pointer"
          aria-label={distance !== null ? `Udaljenost ${distance.toFixed(0)} km. Dodirni za otvaranje mape.` : "Prikaži rutu na mapi"}
        >
          <Icon
            name="location_on"
            className="text-[22px] text-muted-foreground group-hover:text-primary transition-colors shrink-0"
          />
          {distance !== null ? (
            <span className="text-sm font-black tracking-tight font-sans">
              {distance.toFixed(0)} km
            </span>
          ) : (
            <span className="text-[9px] uppercase font-black tracking-wider text-muted-foreground/80 group-hover:text-primary">
              {geoError ? "? km" : "Ruta"}
            </span>
          )}
        </button>
      </div>

      {/* 📅 Expandable 3‑day forecast */}
      {forecastOpen && dailyForecast && dailyForecast.length > 0 && (
        <div className="mt-2 mobile-glass rounded-2xl p-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-1">
            <span>Prognoza</span>
            <span>Visoko / Nisko</span>
          </div>
          <div className="space-y-1.5">
            {dailyForecast.slice(0, 3).map((day, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black text-foreground w-8">
                    {idx === 0 ? "Danas" : day.day}
                  </span>
                  {getSmallWeatherIcon(day.weathercode)}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-foreground">{Math.round(day.tempHigh)}°</span>
                  <span className="text-muted-foreground/50">/</span>
                  <span className="text-muted-foreground/60">{Math.round(day.tempLow)}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
