"use client"

import Link from "next/link"
import { Icon } from "@/components/ui/Icon"
import { ShareButton } from "./ShareButton"
import { WeatherBadge } from "./ShowcaseHero"
import { CurrentOperationalStatus } from "./OperationalPortal"
import { DistanceCalculator } from "./DistanceCalculator"
import { MobileUnifiedControlPill } from "./MobileUnifiedControlPill"

interface CurrentWeather {
  temperature: number;
  weathercode: number;
}

interface HeroActionPillProps {
  facility: {
    name: string
    slug: string
    lat?: number | string | null
    lng?: number | string | null
    hours: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }>
    streetName: string
    streetNumber: string
    postalCode: string
    city: string
  }
  facilitySlug: string
  categorySlug: string
  weather: CurrentWeather | null
}

/**
 * 🧭 HeroActionPill — Unified action bar for the facility hero section.
 *
 * Consolidates navigation, sharing, weather, operational status, distance,
 * and the mobile unified pill into a single client component.
 * Weather data is fetched server-side and passed as a prop.
 */
export function HeroActionPill({ facility, facilitySlug, categorySlug, weather }: HeroActionPillProps) {
  return (
    <>
      {/* 📱 MOBILE SHARE ROW */}
      <div className="flex md:hidden items-center justify-end">
        <ShareButton
          title={facility.name}
          url={`${process.env.NEXT_PUBLIC_SITE_URL}/${facilitySlug}`}
        />
      </div>

      {/* 🧭 DESKTOP ACTIONS */}
      <div className="hidden md:flex flex-wrap gap-2 items-center">
        <Link
          href={`/${categorySlug}`}
          className="px-4 py-2 rounded-full backdrop-blur-xl bg-white/5 text-xs font-black flex items-center gap-2 hover:bg-white/10 transition-all border border-border uppercase tracking-widest text-muted-foreground"
        >
          <Icon name="arrow_back" className="text-[12px]" /> Nazad
        </Link>
        <ShareButton
          title={facility.name}
          url={`${process.env.NEXT_PUBLIC_SITE_URL}/${facilitySlug}`}
        />
        {weather && <WeatherBadge weather={weather} />}
      </div>

      {/* 🏙️ HERO INFO ROW */}
      <div className="flex flex-wrap items-center gap-6 text-slate-300 font-bold pb-4 w-full">
        <div className="hidden md:flex items-center gap-2 bg-muted/50 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-border">
          <Icon name="location_on" className="text-[16px] text-cyan-400" />
          <span className="text-sm tracking-tight font-medium opacity-80">
            {facility.streetName} {facility.streetNumber}, {facility.postalCode} {facility.city}
          </span>
        </div>
        <div className="hidden md:block">
          <CurrentOperationalStatus hours={facility.hours} />
        </div>
        <div className="hidden md:block">
          {facility.lat && facility.lng && (
            <DistanceCalculator
              destLat={Number(facility.lat)}
              destLng={Number(facility.lng)}
              facilityName={facility.name}
            />
          )}
        </div>
        <div className="block md:hidden w-full pt-2">
          <MobileUnifiedControlPill
            hours={facility.hours}
            destLat={Number(facility.lat)}
            destLng={Number(facility.lng)}
          />
        </div>
      </div>
    </>
  )
}
