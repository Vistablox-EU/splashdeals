"use client"
import { Icon } from "@/components/ui/Icon";

import React from "react"
import { cn } from "@/lib/utils"

interface Amenity {
  id: string
  name: string
  icon: string
  category: string | null
  type: "BOOLEAN" | "QUANTIFIABLE" | "TEXT"
}

interface FacilityAmenity {
  amenityId: string
  value: string | null
  imageUrl?: string | null
  scheduledAt?: string | null
  isFeatured?: boolean
  amenity: Amenity
}

import { Dict } from "@/lib/types";

interface ShowcaseAmenitiesProps {
  amenities: FacilityAmenity[]
  dict: Dict
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
}

function resolveAmenityIcon(iconName: string): string {
  if (!iconName) return "star"
  // Direct match
  if (AMENITY_ICON_MAP[iconName]) return AMENITY_ICON_MAP[iconName]
  // Snake_case to Material Symbol (may already be a valid material symbol name)
  return iconName.toLowerCase().replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

export function ShowcaseAmenities({ amenities, dict }: ShowcaseAmenitiesProps) {
  // Filter out pending activations
  const activeAmenities = amenities.filter(fa => {
    if (!fa.scheduledAt) return true
    return new Date(fa.scheduledAt) <= new Date()
  })

  // Sort: Featured first, then rest
  const sortedAmenities = [...activeAmenities].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1
    if (!a.isFeatured && b.isFeatured) return 1
    return 0
  })

  const getTranslatedName = (name: string) => {
    const key = name.toLowerCase().replace(/['\s]+/g, '_')
    return (dict?.amenities as Record<string, string>)?.[key] || name
  }

  if (sortedAmenities.length === 0) return null

  return (
    <div className="w-full">
      {/* 🍱 Premium spaced grid layout */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {sortedAmenities.map((fa) => {
          const iconName = resolveAmenityIcon(fa.amenity.icon)

          return (
            <div
              key={fa.amenityId}
              className="relative group flex flex-row items-center gap-3 p-4 min-h-[76px] rounded-2xl border border-border bg-card/40 backdrop-blur-md hover:border-primary/30 hover:bg-muted/20 transition-all duration-500 cursor-default overflow-hidden sm:flex-col sm:items-center sm:justify-center sm:text-center sm:p-8 sm:min-h-[170px]"
            >
              {/* 🔮 Glow Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* 🧿 Icon Container (Neon Glassmorphism) */}
              <div className="relative z-10 flex items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-white/[0.03] text-primary border border-border shadow-inner backdrop-blur-md transition-all duration-500 group-hover:scale-110 sm:w-14 sm:h-14 sm:rounded-2xl sm:mb-4">
                <Icon name={iconName} className="text-[20px] text-primary sm:text-[24px]" />
              </div>

              {/* 🏷️ Info Container */}
              <div className="relative z-10 flex flex-col justify-center text-left space-y-1 sm:items-center sm:text-center">
                <h4 className="text-[11px] xs:text-xs font-black uppercase tracking-wider text-foreground/80 group-hover:text-white transition-colors leading-snug line-clamp-2 sm:line-clamp-none max-w-[130px] sm:max-w-[180px]">
                  {getTranslatedName(fa.amenity.name)}
                </h4>
                
                {fa.amenity.type !== "BOOLEAN" && fa.value && (
                  <div className={cn(
                    "text-[9px] xs:text-[10px] uppercase tracking-widest line-clamp-1",
                    fa.amenity.type === "TEXT" && fa.value.length > 20 
                      ? "text-slate-400 font-medium normal-case tracking-normal leading-relaxed text-[11px] mt-1 text-left sm:text-center" 
                      : "text-primary font-bold"
                  )}>
                    {fa.value}
                  </div>
                )}

                {/* Glowing availability badge */}
                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity mt-0.5 sm:mt-2 sm:justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)] animate-pulse" />
                  <span className="text-[8px] xs:text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-400">
                    {dict?.amenities?.available || "Dostupno"}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
