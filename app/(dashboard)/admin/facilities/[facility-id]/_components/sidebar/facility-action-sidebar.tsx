"use client";

import { SocialLinksWidget } from "./social-links-widget";
import { PublicContactWidget } from "./public-contact-widget";
import { Skeleton } from "@/components/ui/skeleton";

interface FacilityActionSidebarProps {
  facility: {
    id: string;
    socialLinks?: Record<string, string | undefined>;
    publicPhone?: string | null;
    publicEmail?: string | null;
  };
}

/**
 * 🏛️ FacilityActionSidebar (MVP Essentials - V4 Pro)
 *
 * Optimized for ShadCN design tokens and Next.js 16 PPR patterns.
 */
export function FacilityActionSidebar({ facility }: FacilityActionSidebarProps) {
  return (
    <div className="space-y-6">
      {/* 🖼️ Logo Portal Target */}
      <div id="logo-portal-target" className="space-y-4" />

      {/* 🔗 External Touchpoints (Real Data) */}
      <div className="space-y-4">
        <div className="px-1">
          <span className="text-muted-foreground/60 text-[10px] font-black tracking-[0.2em] uppercase">
            Javni kontakti
          </span>
        </div>

        <SocialLinksWidget
          facilityId={facility.id}
          initialSocialLinks={(facility.socialLinks ?? {}) as Record<string, string | undefined>}
        />

        <PublicContactWidget
          facilityId={facility.id}
          initialContact={{
            publicPhone: facility.publicPhone,
            publicEmail: facility.publicEmail,
          }}
        />

        {/* 📍 Geolocation Portal Target */}
        <div id="location-portal-target" className="space-y-4" />
      </div>
    </div>
  );
}

/**
 * 🦴 FacilityActionSidebarSkeleton
 * Mirrors the V4 Pro sidebar layout exactly to eliminate CLS during hydration.
 */
export function FacilityActionSidebarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Logo Card Skeleton */}
      <Skeleton className="h-32 w-full rounded-xl" />

      {/* Connectivity Skeleton */}
      <div className="space-y-4">
        <Skeleton className="mx-1 h-2 w-32" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}
