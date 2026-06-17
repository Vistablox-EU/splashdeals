"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { MobileOverlayHeader } from "./MobileOverlayHeader";
import { MobileCityPicker } from "./MobileCityPicker";
;

interface City {
  id: string;
  name: string;
  slug: string;
}

interface MobileOverlayProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (v: boolean) => void;
  dict: any;
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
  ];

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[1000] bg-background/95 backdrop-blur-3xl md:hidden flex flex-col p-8 overflow-hidden animate-in slide-in-from-right duration-300"
        >
          <MobileOverlayHeader onClose={() => setIsMobileMenuOpen(false)} />

          <div className="flex flex-col gap-6 overflow-hidden">
            {/* Explore First */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
              <Link
                href={navLinks[0].href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-4xl font-black italic tracking-tighter text-white uppercase flex items-center gap-4 hover:text-primary transition-colors"
              >
                <Icon name="search" className="text-[32px] text-primary" />
                {navLinks[0].name}
              </Link>
            </div>

            {/* Cities Section */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
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
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${300 + (i * 100)}ms` }}
              >
                <Link
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-4xl font-black italic tracking-tighter text-white uppercase flex items-center gap-4 hover:text-primary transition-colors"
                >
                  <Icon name={link.icon} className="text-[32px] text-primary" />
                  {link.name}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
            <LiquidButton className="w-full h-14 text-base" onClick={() => setIsMobileMenuOpen(false)}>
              {dict?.nav?.get_pass || "Uzmi kartu"}
            </LiquidButton>
            <div className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
              {dict?.home?.rights_reserved || "Srbijini najbolji akva parkovi"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
