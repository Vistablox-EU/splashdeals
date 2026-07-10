"use client";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DistanceCalculatorProps {
  destLat: number;
  destLng: number;
  facilityName: string;
}

/**
 * 🧭 DistanceCalculator Island (Client)
 * Saturates HTML5 Geolocation API to calculate live distance from user device
 * to destination using high-precision trigonometry (Haversine Formula),
 * seamlessly delegating to device OS map navigators.
 */
export function DistanceCalculator({ destLat, destLng }: DistanceCalculatorProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Trigonometric Distance Calculation (Haversine)
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
    return R * c; // Distance in km
  };

  const handleCalculate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError(true);
      return;
    }

    // 📳 Vibrate feedback
    if ("vibrate" in navigator) navigator.vibrate(10);

    // If already calculated, serve as a direct Map link launcher
    if (distance !== null) {
      const isApple =
        typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
      const url = isApple
        ? `maps://maps.google.com/maps?daddr=${destLat},${destLng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;

      window.open(url, "_blank");
      return;
    }

    setLoading(true);

    // 📍 HTML5 Geolocation API Activation
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        const dist = calculateDistance(userLat, userLng, destLat, destLng);
        setDistance(dist);
        setLoading(false);

        if ("vibrate" in navigator) navigator.vibrate([15, 40, 15]);
      },
      (err) => {
        console.error("Geolocation blocked/error:", err);
        setLoading(false);
        setError(true);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (error) return null;

  return (
    <Button
      onClick={handleCalculate}
      disabled={loading}
      className={cn(
        "group flex cursor-pointer items-center gap-2 rounded-2xl border px-5 py-2.5 text-xs font-black tracking-widest uppercase backdrop-blur-md transition-all duration-500",
        distance !== null
          ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.1)] hover:scale-105"
          : "border-border hover:text-foreground bg-muted/20 hover:bg-muted/30 active:scale-95",
      )}
    >
      {loading ? (
        <>
          <Icon name="explore" className="text-primary animate-spin text-[16px]" />
          <span className="hidden md:inline">Računam...</span>
        </>
      ) : distance !== null ? (
        <>
          <Icon name="navigation" className="text-primary animate-pulse fill-current text-[16px]" />
          <span>
            <span className="hidden md:inline">Udaljenost: </span>
            {distance.toFixed(0)} km
          </span>
          <div className="bg-primary/20 ml-1 h-3 w-px" />
          <Icon
            name="open_in_new"
            className="text-[12px] opacity-60 transition-opacity group-hover:opacity-100"
          />
        </>
      ) : (
        <>
          <Icon
            name="navigation"
            className="group-hover:text-primary text-muted-foreground text-[16px] transition-colors"
          />
          <span className="hidden md:inline">Prikaži Udaljenost</span>
        </>
      )}
    </Button>
  );
}
