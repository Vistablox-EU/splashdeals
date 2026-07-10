"use client";
import { Icon } from "@/components/ui/Icon";

import React from "react";
import { cn } from "@/lib/utils";

interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: string | null;
  type: "BOOLEAN" | "QUANTIFIABLE" | "TEXT";
}

interface FacilityAmenity {
  amenityId: string;
  value: string | null;
  imageUrl?: string | null;
  scheduledAt?: string | null;
  isFeatured?: boolean;
  amenity: Amenity;
}

import { Dict } from "@/lib/types";

interface ShowcaseAmenitiesProps {
  amenities: FacilityAmenity[];
  dict: Dict;
}

/**
 * Maps legacy Lucide icon names (stored in DB) to Material Symbols names.
 * Falls back to "star" if the icon name is unknown.
 */
const AMENITY_ICON_MAP: Record<string, string> = {
  waves: "waves",
  droplets: "water_drop",
  thermometer: "device_thermostat",
  sun: "light_mode",
  umbrella: "beach_access",
  parking: "local_parking",
  wifi: "wifi",
  coffee: "local_cafe",
  utensils: "restaurant",
  shopping_bag: "shopping_bag",
  accessibility: "accessible",
  baby: "child_care",
  shower: "shower",
  lock: "lock",
  camera: "photo_camera",
  music: "music_note",
  heart: "favorite",
  star: "star",
  zap: "bolt",
  shield: "shield",
  clock: "schedule",
  map_pin: "location_on",
  phone: "phone",
  info: "info",
  check: "check_circle",
  x: "cancel",
  play: "play_arrow",
  users: "group",
  user: "person",
  // Common amenity icon variants
  Waves: "waves",
  Droplets: "water_drop",
  Thermometer: "device_thermostat",
  Sun: "light_mode",
  Umbrella: "beach_access",
  Wifi: "wifi",
  Coffee: "local_cafe",
  Utensils: "restaurant",
  ShoppingBag: "shopping_bag",
  Accessibility: "accessible",
  Baby: "child_care",
  Shower: "shower",
  Lock: "lock",
  Camera: "photo_camera",
  Music: "music_note",
  Heart: "favorite",
  Star: "star",
  Zap: "bolt",
  Shield: "shield",
  Clock: "schedule",
  MapPin: "location_on",
  Phone: "phone",
  Info: "info",
  Check: "check_circle",
  Play: "play_arrow",
  Users: "group",
  User: "person",
  Wind: "air",
  wind: "air",
  Car: "directions_car",
  car: "directions_car",
};

function resolveAmenityIcon(iconName: string): string {
  if (!iconName) return "star";
  // Direct match
  if (AMENITY_ICON_MAP[iconName]) return AMENITY_ICON_MAP[iconName];
  // Snake_case to Material Symbol (may already be a valid material symbol name)
  return iconName.toLowerCase().replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

export function ShowcaseAmenities({ amenities, dict }: ShowcaseAmenitiesProps) {
  // Filter out pending activations
  const activeAmenities = amenities.filter((fa) => {
    if (!fa.scheduledAt) return true;
    return new Date(fa.scheduledAt) <= new Date();
  });

  // Sort: Featured first, then rest
  const sortedAmenities = [...activeAmenities].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  const getTranslatedName = (name: string) => {
    const key = name.toLowerCase().replace(/['\s]+/g, "_");
    return (dict?.amenities as Record<string, string>)?.[key] || name;
  };

  if (sortedAmenities.length === 0) return null;

  return (
    <div className="w-full">
      {/* 🍱 Premium spaced grid layout */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sortedAmenities.map((fa) => {
          const iconName = resolveAmenityIcon(fa.amenity.icon);

          return (
            <div
              key={fa.amenityId}
              className="group border-border bg-card/40 hover:border-primary/30 hover:bg-muted/20 relative flex min-h-[76px] cursor-default flex-row items-center gap-3 overflow-hidden rounded-2xl border p-4 backdrop-blur-md transition-all duration-500 sm:min-h-[170px] sm:flex-col sm:items-center sm:justify-center sm:p-8 sm:text-center"
            >
              {/* 🔮 Glow Hover Effect */}
              <div className="from-primary/[0.02] pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              {/* 🧿 Icon Container (Neon Glassmorphism) */}
              <div className="text-primary border-border bg-muted/10 relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-inner backdrop-blur-md transition-all duration-500 group-hover:scale-110 sm:mb-4 sm:h-14 sm:w-14 sm:rounded-2xl">
                <Icon name={iconName} className="text-primary text-[20px] sm:text-[24px]" />
              </div>

              {/* 🏷️ Info Container */}
              <div className="relative z-10 flex flex-col justify-center space-y-1 text-left sm:items-center sm:text-center">
                <h4 className="xs:text-xs text-foreground/80 group-hover:text-foreground line-clamp-2 max-w-[130px] text-[11px] leading-snug font-black tracking-wider uppercase transition-colors sm:line-clamp-none sm:max-w-[180px]">
                  {getTranslatedName(fa.amenity.name)}
                </h4>

                {fa.amenity.type !== "BOOLEAN" && fa.value && (
                  <div
                    className={cn(
                      "xs:text-[10px] line-clamp-1 text-[9px] tracking-widest uppercase",
                      fa.amenity.type === "TEXT" && fa.value.length > 20
                        ? "text-muted-foreground mt-1 text-left text-[11px] leading-relaxed font-medium tracking-normal normal-case sm:text-center"
                        : "text-primary font-bold",
                    )}
                  >
                    {fa.value}
                  </div>
                )}

                {/* Glowing availability badge */}
                <div className="mt-0.5 flex items-center gap-1.5 opacity-60 transition-opacity group-hover:opacity-100 sm:mt-2 sm:justify-center">
                  <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                  <span className="xs:text-[9px] text-muted-foreground text-[8px] font-black tracking-widest uppercase">
                    {dict?.amenities?.available || "Dostupno"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
