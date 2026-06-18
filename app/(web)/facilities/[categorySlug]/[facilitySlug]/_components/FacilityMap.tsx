"use client";
import { Icon } from "@/components/ui/Icon";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FacilityMapProps {
  lat: number;
  lng: number;
  facilityName: string;
  streetName: string;
  streetNumber: string;
  postalCode: string;
  city: string;
}

/**
 * 🗺️ FacilityMap Component
 * High-performance client-only interactive Leaflet map styled in Dark Matter mode,
 * utilizing high-density glassmorphism styling and custom CSS glowing markers.
 */
export function FacilityMap({
  lat,
  lng,
  facilityName,
  streetName,
  streetNumber,
  postalCode,
  city,
}: FacilityMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const fullAddress = `${streetName} ${streetNumber}, ${postalCode} ${city}`;

  const openDirections = () => {
    if (typeof window === "undefined") return;
    const isApple = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
    const url = isApple
      ? `maps://maps.google.com/maps?daddr=${lat},${lng}&ll=`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // 🗺️ Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: false, // Disabling standard control to keep UI clean
      attributionControl: false,
    });

    mapRef.current = map;

    // ➕ Add Subtle Zoom Control at the Bottom Right
    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);

    // 🗺️ Load CartoDB Voyager Tile Layer (brighter, premium look with excellent contrast)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
    }).addTo(map);

    // 🎨 Custom pulsing Leaflet DivIcon (No image files required, avoids broken paths)
    const customIcon = L.divIcon({
      className: "custom-pulsing-marker-wrapper",
      html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; items: center; justify-content: center;">
          <div style="
            position: absolute;
            border: 4px solid rgba(6, 182, 212, 0.4);
            border-radius: 50%;
            height: 44px;
            width: 44px;
            animation: map-pulsate 1.8s ease-out infinite;
            box-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
          "></div>
          <div style="
            width: 16px;
            height: 16px;
            background-color: #06b6d4;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(6, 182, 212, 0.9);
            z-index: 10;
          "></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    // 📍 Add marker to the Map
    L.marker([lat, lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(
        `<div style="color: #0f172a; font-family: sans-serif; font-weight: 800; font-size: 13px; text-transform: uppercase; padding: 4px 8px;">
          ${facilityName}
         </div>`,
        { closeButton: false }
      )
      .openPopup();

    // 🧹 Cleanup Map instance on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, facilityName]);

  return (
    <Card className="relative overflow-hidden p-6 md:p-8 border-cyan-500/10 shadow-2xl flex flex-col gap-6">
      {/* Dynamic Keyframe Injection for the Glow effect */}
      <style jsx global>{`
        @keyframes map-pulsate {
          0% {
            transform: scale(0.2);
            opacity: 1;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        /* Custom Leaflet popup adjustments */
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
        }
        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
      `}</style>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
            <Icon name="explore" className="text-[14px] animate-pulse" />
            <span>Geolokacija Objekta</span>
          </div>
          <h3 className="text-xl md:text-3xl font-black italic text-foreground uppercase tracking-tight">
            Pronađi Nas Na <span className="text-primary">Mapi.</span>
          </h3>
          <p className="text-slate-400 text-xs font-semibold flex items-center gap-1.5 mt-1">
            <Icon name="location_on" className="text-[14px] text-cyan-500 shrink-0" />
            <span>{fullAddress}</span>
          </p>
        </div>

        <button
          onClick={openDirections}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 active:scale-95 transition-all text-xs font-black uppercase tracking-wider self-start md:self-auto cursor-pointer"
        >
          <Icon name="navigation" className="text-[14px] fill-current" />
          <span>Navigacija</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[320px] md:h-[400px] rounded-3xl overflow-hidden border border-border shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-10 bg-slate-200" />
        
        {/* Subtle glass overlay inside corner */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none px-4 py-2 rounded-xl backdrop-blur-md bg-background/60 border border-border text-[10px] font-black uppercase tracking-wider text-primary">
          📍 {facilityName}
        </div>
      </div>
    </Card>
  );
}
