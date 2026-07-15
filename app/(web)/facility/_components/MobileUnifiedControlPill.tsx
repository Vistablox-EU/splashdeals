"use client";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";

import { useEffect, useRef, useState } from "react";
import { formatTime24h } from "@/lib/utils/date-time";

interface HoursSubset {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface MobileUnifiedControlPillProps {
  hours: HoursSubset[];
  destLat: number;
  destLng: number;
}

function deriveTodayInfo(hours: HoursSubset[]) {
  const todayId = new Date().getDay();
  const today = hours?.find?.((h) => h.dayOfWeek === todayId);
  if (!today) return { todayHours: null as HoursSubset | null, isOpen: null as boolean | null };

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
}

export function MobileUnifiedControlPill({
  hours = [],
  destLat,
  destLng,
}: MobileUnifiedControlPillProps) {
  const [geoState, setGeoState] = useState<{ distance: number | null; failed: boolean }>({
    distance: null,
    failed: false,
  });
  const geoTimeoutRef = useRef<number | null>(null);

  // Client-only time calc — avoids SSR/client timezone hydration mismatch (#418)
  const [todayInfo, setTodayInfo] = useState<{
    todayHours: HoursSubset | null;
    isOpen: boolean | null;
  }>({ todayHours: null, isOpen: null });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTodayInfo(deriveTodayInfo(hours));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hours]);

  const { todayHours, isOpen } = todayInfo;
  const { distance, failed: geoError } = geoState;

  // 🧭 Geolocation (Haversine) — user-initiated, never auto-fires
  const calculateDistance = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState({ distance: null, failed: true });
      return;
    }

    setGeoState({ distance: null, failed: false }); // show loading state
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
        setGeoState({
          distance: R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
          failed: false,
        });
      },
      () => {
        if (geoTimeoutRef.current !== null) window.clearTimeout(geoTimeoutRef.current);
        setGeoState({ distance: null, failed: true });
      },
      { enableHighAccuracy: false, timeout: 5000 },
    );
  };

  // 🗺️ Navigation trigger
  const handleNavigation = () => {
    // If distance already known, open maps directly
    if (distance !== null) {
      if ("vibrate" in navigator) navigator.vibrate(15);
      const isApple =
        typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
      const url = isApple
        ? `maps://maps.google.com/maps?daddr=${destLat},${destLng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
      window.open(url, "_blank");
      return;
    }
    // First tap: calculate distance
    calculateDistance();
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mobile-glass border-primary/10 relative flex h-16 w-full items-center justify-between rounded-full px-4 shadow-2xl select-none">
        {/* ⏰ Segment 1: Operating Hours */}
        <div
          className="flex flex-[1.3] items-center justify-center gap-1.5 px-2"
          aria-label={
            todayHours
              ? todayHours.isClosed
                ? "Zatvoreno danas"
                : `Radno vreme: ${formatTime24h(todayHours.openTime)} – ${formatTime24h(todayHours.closeTime)}`
              : "Radno vreme nije dostupno"
          }
        >
          <div className="relative shrink-0">
            <Icon name="schedule" className="text-muted-foreground text-[22px]" />
            {isOpen === true && (
              <span className="bg-primary absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
            )}
          </div>
          <div className="flex flex-col items-start -space-y-0.5 leading-tight">
            {todayHours ? (
              todayHours.isClosed ? (
                <span className="text-muted-foreground text-xs font-bold tracking-tight">
                  Zatvoreno
                </span>
              ) : (
                <>
                  <span
                    className={
                      isOpen
                        ? "text-primary text-sm font-black tracking-tight"
                        : "text-muted-foreground text-xs font-bold tracking-tight"
                    }
                  >
                    {isOpen ? "Otvoreno" : "Zatvoreno"}
                  </span>
                  <span className="text-muted-foreground text-[10px] leading-none font-bold tracking-tight">
                    {formatTime24h(todayHours.openTime)}–{formatTime24h(todayHours.closeTime)}
                  </span>
                </>
              )
            ) : (
              <span className="text-muted-foreground text-sm font-black tracking-tight">--:--</span>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="bg-border/30 h-6 w-px shrink-0 self-center" />

        {/* 🧭 Segment 2: Navigation */}
        <Button
          variant="ghost"
          onClick={handleNavigation}
          className="text-foreground hover:text-primary group flex h-full flex-1 origin-center items-center justify-center gap-1.5 px-2 transition-colors active:scale-90"
          aria-label={
            distance !== null
              ? `Udaljenost ${distance.toFixed(0)} km. Dodirni za otvaranje mape.`
              : "Prikaži rutu na mapi"
          }
        >
          <Icon
            name="location_on"
            className="text-muted-foreground group-hover:text-primary shrink-0 text-[22px] transition-colors"
          />
          {distance !== null ? (
            <span className="font-sans text-sm font-black tracking-tight">
              {distance.toFixed(0)} km
            </span>
          ) : (
            <span className="text-muted-foreground/80 group-hover:text-primary text-[9px] font-black tracking-wider uppercase">
              {geoError ? "? km" : "Ruta"}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
