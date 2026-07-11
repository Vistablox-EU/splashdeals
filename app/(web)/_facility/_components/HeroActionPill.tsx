"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ShareButton } from "./ShareButton";
import { WeatherBadge } from "./ShowcaseHero";
import { CurrentOperationalStatus } from "./OperationalPortal";
import { DistanceCalculator } from "./DistanceCalculator";
import { MobileUnifiedControlPill } from "./MobileUnifiedControlPill";

interface CurrentWeather {
  temperature: number;
  weathercode: number;
}

interface HeroActionPillProps {
  facility: {
    name: string;
    slug: string;
    lat?: number | string | null;
    lng?: number | string | null;
    hours: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }>;
    streetName: string;
    streetNumber: string;
    postalCode: string;
    city: string;
  };
  facilitySlug: string;
  categorySlug: string;
  weather: CurrentWeather | null;
}

/**
 * 🧭 HeroActionPill — Unified action bar for the facility hero section.
 *
 * Consolidates navigation, sharing, weather, operational status, distance,
 * and the mobile unified pill into a single client component.
 * Weather data is fetched server-side and passed as a prop.
 */
export function HeroActionPill({
  facility,
  facilitySlug,
  categorySlug,
  weather,
}: HeroActionPillProps) {
  return (
    <>
      {/* 📱 MOBILE SHARE ROW */}
      <div className="flex items-center justify-end md:hidden">
        <ShareButton
          title={facility.name}
          url={`${process.env.NEXT_PUBLIC_SITE_URL || ""}/${facilitySlug}`}
        />
      </div>

      {/* 🧭 DESKTOP ACTIONS */}
      <div className="hidden flex-wrap items-center gap-2 md:flex">
        <Link
          href={`/${categorySlug}`}
          className="border-border text-muted-foreground bg-muted/20 hover:bg-muted/30 flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black tracking-widest uppercase backdrop-blur-xl transition-all"
        >
          <Icon name="arrow_back" className="text-[12px]" /> Nazad
        </Link>
        <ShareButton
          title={facility.name}
          url={`${process.env.NEXT_PUBLIC_SITE_URL || ""}/${facilitySlug}`}
        />
        {weather && <WeatherBadge weather={weather} />}
      </div>

      {/* 🏙️ HERO INFO ROW */}
      <div className="text-muted-foreground flex w-full flex-wrap items-center gap-6 pb-4 font-bold">
        <div className="bg-muted/50 border-border hidden items-center gap-2 rounded-2xl border px-5 py-2.5 backdrop-blur-md md:flex">
          <Icon name="location_on" className="text-primary text-[16px]" />
          <span className="text-sm font-medium tracking-tight opacity-80">
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
        <div className="block w-full pt-2 md:hidden">
          <MobileUnifiedControlPill
            hours={facility.hours}
            destLat={Number(facility.lat)}
            destLng={Number(facility.lng)}
          />
        </div>
      </div>
    </>
  );
}
