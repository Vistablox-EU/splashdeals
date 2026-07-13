"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { MobileOverlayHeader } from "./MobileOverlayHeader";
import { MobileCityPicker } from "./MobileCityPicker";
interface City {
  id: string;
  name: string;
  slug: string;
}

import type { Dict } from "@/lib/types";

interface MobileOverlayProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (v: boolean) => void;
  dict: Dict;
  cities: City[];
  isReducedMotion: boolean;
  isTabActive: boolean;
}

export function MobileOverlay({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  dict,
  cities,
}: MobileOverlayProps) {
  const navLinks = [
    { name: dict.nav.explore, href: `/search`, icon: "search" },
    { name: dict.nav.waterparks || "Akva Parkovi", href: `/akva-parkovi`, icon: "location_on" },
    { name: dict.nav.deals || "Akcije", href: `/#deals`, icon: "shopping_bag" },
    { name: dict.nav.login || "Prijava", href: `/prijava`, icon: "person" },
  ];

  return (
    <>
      {isMobileMenuOpen && (
        <div className="bg-background/95 animate-in slide-in-from-right fixed inset-0 z-[1000] flex flex-col overflow-hidden p-8 backdrop-blur-3xl duration-300 md:hidden">
          <MobileOverlayHeader onClose={() => setIsMobileMenuOpen(false)} />

          <div className="flex flex-col gap-6 overflow-hidden">
            {/* Explore First */}
            <div className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-100 duration-500">
              <Link
                href={navLinks[0].href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-primary text-foreground flex items-center gap-4 py-2 text-4xl font-black tracking-tighter uppercase italic transition-colors"
              >
                <Icon name="search" className="text-primary text-[32px]" />
                {navLinks[0].name}
              </Link>
            </div>

            {/* Cities Section */}
            <div className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-200 duration-500">
              <MobileCityPicker
                cities={cities}
                dict={dict}
                onCitySelect={() => setIsMobileMenuOpen(false)}
              />
            </div>

            {/* Remaining Links */}
            {navLinks.slice(1).map((link, i) => (
              <div
                key={link.name}
                className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500"
                style={{ animationDelay: `${300 + i * 100}ms` }}
              >
                <Link
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-primary text-foreground flex items-center gap-4 py-2 text-4xl font-black tracking-tighter uppercase italic transition-colors"
                >
                  <Icon name={link.icon} className="text-primary text-[32px]" />
                  {link.name}
                </Link>
              </div>
            ))}
          </div>

          <div className="border-border/10 mt-auto space-y-4 border-t pt-6">
            <LiquidButton
              className="h-14 w-full text-base"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {dict?.nav?.get_pass || "Uzmi kartu"}
            </LiquidButton>
            <div className="text-muted-foreground text-center text-xs font-bold tracking-widest uppercase">
              {dict?.home?.rights_reserved || "Srbijini najbolji akva parkovi"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
