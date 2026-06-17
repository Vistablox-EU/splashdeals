"use client";
import { Icon } from "@/components/ui/Icon";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface City {
  id: string;
  name: string;
  slug: string;
}

interface FeaturedFacility {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  canonicalPath: string;
  imageUrl: string;
  startingPrice: number | null;
  description: string;
}

interface DiscoveryMenuData {
  cities: City[];
  featured: FeaturedFacility | null;
}

interface MegaMenuProps {
  dict: any;
}

/**
 * 🏙️ Premium Revolut-Style Mega Menu Navigation Bar
 */
export function MegaMenu({ dict }: MegaMenuProps) {
  const [data, setData] = useState<DiscoveryMenuData>({ cities: [], featured: null });
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchDiscoveryData = async () => {
      try {
        const response = await fetch("/api/menu/discovery");
        const payload = await response.json();
        if (payload) {
          setData({
            cities: payload.cities || [],
            featured: payload.featured || null
          });
        }
      } catch (error) {
        console.error("🌋 Header Discovery API Failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscoveryData();
  }, []);

  const sortedCities = React.useMemo(() => {
    if (!data.cities || !Array.isArray(data.cities)) return [];
    const popularSlugs = ["belgrade", "beograd", "novi-sad", "jagodina", "vrnjacka-banja", "subotica"];
    const popular = data.cities.filter(c => popularSlugs.includes(c.slug.toLowerCase()));
    const others = data.cities.filter(c => !popularSlugs.includes(c.slug.toLowerCase()));
    return [...popular, ...others];
  }, [data.cities]);

  const handleMouseEnter = (index: number) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setActiveTab(index);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => {
      setActiveTab(null);
    }, 200);
  };

  const menuTriggers = [
    { label: dict?.nav?.explore || "Istraži", icon: "explore" },
    { label: "Za Biznis", icon: "business_center" },
    { label: "Korisnici", icon: "smartphone" }
  ];

  return (
    <div
      className="hidden md:flex items-center gap-2 relative"
      onMouseLeave={handleMouseLeave}
    >
      {/* ==========================================
          NAVBAR HOVER TRIGGERS
          ========================================== */}
      <ul className="flex items-center gap-2 p-2 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-full relative transition-all duration-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        {menuTriggers.map((trigger, idx) => {
          const isActive = activeTab === idx;
          return (
            <li
              key={idx}
              className="relative px-8 py-4 flex items-center"
              onMouseEnter={() => handleMouseEnter(idx)}
            >
              {isActive && (
                <div
                  className="absolute inset-0 bg-white/10 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-md border border-cyan-500/20 z-0 transition-all duration-300"
                />
              )}
              <button
                className={cn(
                  "relative z-10 text-[13px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-3 select-none outline-none cursor-pointer",
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Icon name={trigger.icon} className={cn(
                  "text-[18px] transition-colors",
                  isActive ? "text-cyan-400" : "text-cyan-500/60"
                )} />
                {trigger.label}
                <Icon name="keyboard_arrow_down" className={cn(
                  "text-[16px] opacity-50 transition-transform duration-300",
                  isActive && "rotate-180 opacity-100 text-cyan-400"
                )} />
              </button>
            </li>
          );
        })}
      </ul>

      {/* ==========================================
          MORPHING DROPDOWN PANELS
          ========================================== */}
        {activeTab !== null && (
          <div
            onMouseEnter={() => {
              if (closeTimeout.current) clearTimeout(closeTimeout.current);
            }}
            className={cn(
              "absolute top-full mt-6 bg-[#020617] border border-white/10 shadow-[0_28px_70px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] rounded-[2.5rem] z-[120] outline-none overflow-hidden transition-all duration-300",
              activeTab === 0 && "w-[1260px] -translate-x-[22%]",
              activeTab === 1 && "w-[960px] -translate-x-[38%]",
              activeTab === 2 && "w-[800px] -translate-x-[52%]"
            )}
          >
            {/* Inner padding wrapper — overflow:hidden on parent catches any stray scroll */}
            <div className="p-11">

            {/* ==========================================
                PANEL 0: ISTRAŽI PANEL (Explore)
                ========================================== */}
            {activeTab === 0 && (
              <div className="grid grid-cols-12 gap-10 items-stretch">

                {/* Visual Promo Showcase (Col 1-4) */}
                <div className="col-span-4 flex min-h-[320px]">
                  {data.featured ? (
                    <Link
                      href={data.featured.canonicalPath}
                      onClick={() => setActiveTab(null)}
                      className="w-full flex flex-col justify-end p-6 rounded-[1.75rem] overflow-hidden relative group/promo border border-white/5 hover:border-cyan-500/30 transition-all duration-500 shadow-2xl"
                    >
                      <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-10 transition-all duration-500 group-hover/promo:via-slate-950/40" />
                        {data.featured.imageUrl.endsWith(".mp4") ? (
                          <video
                            src={data.featured.imageUrl}
                            autoPlay loop muted playsInline
                            className="w-full h-full object-cover scale-105 group-hover/promo:scale-100 transition-transform duration-700 blur-[0.5px]"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={data.featured.imageUrl}
                            alt={data.featured.name}
                            className="w-full h-full object-cover scale-105 group-hover/promo:scale-100 transition-transform duration-700"
                          />
                        )}
                      </div>

                      <div className="relative z-20 space-y-4">
                        <div className="flex justify-between items-start gap-2">
                          <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)] leading-none">
                            Hit Ponuda
                          </span>
                          {data.featured.startingPrice && (
                            <span className="text-white text-sm font-black bg-slate-950/70 border border-white/5 px-3 py-1.5 rounded-lg backdrop-blur-md">
                              od <span className="text-cyan-400 text-base">{data.featured.startingPrice} RSD</span>
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="text-lg font-black italic uppercase tracking-tight text-white leading-tight">
                            {data.featured.name}
                          </h3>
                          <p className="text-xs text-slate-300 leading-relaxed font-medium opacity-90 line-clamp-2">
                            {data.featured.description}
                          </p>
                        </div>

                        <div className="w-full h-11 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg group-hover/promo:bg-white transition-all duration-300">
                          <Icon name="local_fire_department" className="text-[16px] animate-pulse" /> Kupi Karte
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="w-full bg-white/[0.02] border border-dashed border-white/10 rounded-[1.75rem] flex flex-col items-center justify-center p-8 text-center">
                      <Icon name="auto_awesome" className="text-[40px] text-slate-600 mb-3 animate-pulse" />
                      <span className="text-sm font-bold text-slate-400">Splashdeals Premium</span>
                    </div>
                  )}
                </div>

                {/* Cities Grid (Col 5-10) */}
                <div className="col-span-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">
                      {dict?.nav?.cities || "Gradovi i Regije"}
                    </span>
                    <span className="text-xs font-black text-cyan-500/80 uppercase tracking-widest leading-none flex items-center gap-1.5">
                      <Icon name="auto_awesome" className="text-[14px] animate-pulse" /> Popularno
                    </span>
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {sortedCities.slice(0, 12).map((city) => {
                        const isPopular = ["belgrade", "beograd", "novi-sad", "jagodina", "vrnjacka-banja", "subotica"].includes(city.slug.toLowerCase());
                        return (
                          <Link
                            key={city.id}
                            href={`/search?q=${encodeURIComponent(city.name)}`}
                            onClick={() => setActiveTab(null)}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3.5 text-[13px] font-bold rounded-xl transition-all group/item cursor-pointer",
                              isPopular
                                ? "text-cyan-400 bg-cyan-500/[0.04] hover:text-white hover:bg-cyan-500/10 border border-cyan-500/10 hover:border-cyan-500/30"
                                : "text-slate-300 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/5"
                            )}
                          >
                            <div className="relative flex items-center justify-center shrink-0 w-2.5 h-2.5">
                              {isPopular ? (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                  <div className="absolute inset-0 rounded-full bg-cyan-400 blur-[2px] opacity-40 group-hover/item:scale-[2] transition-all duration-500" />
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-slate-600/60 group-hover/item:bg-cyan-400 transition-all duration-300" />
                                  <div className="absolute inset-0 rounded-full bg-cyan-400 blur-[2px] opacity-0 group-hover/item:opacity-40 group-hover/item:scale-150 transition-all duration-500" />
                                </>
                              )}
                            </div>
                            <span className="truncate">{city.name}</span>
                          </Link>
                        );
                      })}
                      {sortedCities.length > 12 && (
                        <Link
                          href="/facilities"
                          onClick={() => setActiveTab(null)}
                          className="flex items-center justify-center gap-2 px-4 py-3.5 text-[13px] font-bold rounded-xl border border-dashed border-white/10 text-cyan-500/70 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer"
                        >
                          <span>+{sortedCities.length - 12} gradova</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Categories Links (Col 11-12) */}
                <div className="col-span-2 flex flex-col justify-between border-l border-white/5 pl-9">
                  <div className="space-y-1">
                    <div className="border-b border-white/5 pb-4 mb-3">
                      <span className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">
                        Kategorije
                      </span>
                    </div>

                    <div className="flex flex-col">
                      {[
                        { href: "/facilities/waterpark", icon: "waves", label: "Akva Parkovi", cls: "group-hover/link:animate-bounce" },
                        { href: "/facilities/swimming-pool", icon: "waves", label: "Bazeni", cls: "group-hover/link:animate-pulse" },
                        { href: "/facilities/wellness", icon: "auto_awesome", label: "Wellness & Spa", cls: "group-hover/link:animate-spin" },
                      ].map(({ href, icon: iconName, label, cls }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setActiveTab(null)}
                          className="flex items-center gap-3 py-3.5 text-sm font-black italic uppercase tracking-wide text-slate-300 hover:text-cyan-400 transition-colors group/link cursor-pointer"
                        >
                          <Icon name={iconName} className={cn("text-[20px] text-cyan-500", cls)} />
                          <span>{label}</span>
                        </Link>
                      ))}

                      <Link
                        href="/#deals"
                        onClick={() => setActiveTab(null)}
                        className="flex items-center gap-3 py-3.5 text-sm font-black italic uppercase tracking-wide text-cyan-400 hover:text-white transition-colors group/link cursor-pointer"
                      >
                        <Icon name="local_fire_department" className="text-[20px] text-cyan-400" />
                        <span>Sve Akcije</span>
                      </Link>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-white/5">
                    <Link
                      href="/support"
                      onClick={() => setActiveTab(null)}
                      className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <Icon name="help" className="text-[16px] text-slate-600" />
                      <span>Korisnička Pomoć</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                PANEL 1: PARTNERI PANEL (For Business)
                ========================================== */}
            {activeTab === 1 && (
              <div className="grid grid-cols-12 gap-10 items-stretch">

                {/* Ticket Scanner Mockup (Col 1-5) */}
                <div className="col-span-5 flex min-h-[300px]">
                  <div className="w-full bg-slate-950/40 border border-white/5 rounded-[1.75rem] p-7 flex flex-col justify-between relative group/partner overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10" />

                    <div className="relative z-20 space-y-5 flex-1 flex flex-col justify-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-pulse">
                        <Icon name="qr_code_scanner" className="text-[32px]" />
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-black text-cyan-500 uppercase tracking-widest block leading-none">
                          Splash Validator
                        </span>
                        <h4 className="text-sm font-black text-white italic uppercase">
                          Skeniranje uspešno
                        </h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[180px] mx-auto">
                          Ulaznica #PETR-401A je verifikovana na ulazu.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/20 px-3 py-1.5 rounded-lg w-max mx-auto">
                        <Icon name="check_circle" className="text-[16px] text-cyan-400" />
                        <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Validirano</span>
                      </div>
                    </div>

                    <Link
                      href="/facilities"
                      onClick={() => setActiveTab(null)}
                      className="relative z-20 w-full h-12 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg group-hover/partner:bg-white transition-all duration-300 mt-4"
                    >
                      Postani Partner <Icon name="login" className="text-[16px]" />
                    </Link>
                  </div>
                </div>

                {/* Partner Links (Col 6-12) */}
                <div className="col-span-7 flex flex-col justify-between pl-6">
                  <div>
                    <div className="border-b border-white/5 pb-4 mb-6">
                      <span className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">
                        Partner Hub
                      </span>
                    </div>

                    <div className="flex flex-col gap-7">
                      {[
                        {
                          href: "/facilities",
                          icon: "login",
                          title: "Pridruži se mreži bazena",
                          desc: "Predstavite svoj bazen ili akva park stotinama hiljada aktivnih korisnika u Srbiji."
                        },
                        {
                          href: "/admin/facilities",
                          icon: "verified_user",
                          title: "Partner Portal (Admin)",
                          desc: "Upravljajte ponudama, pratite skeniranja i vršite isplate direktno preko Stripe panela."
                        },
                        {
                          href: "/support",
                          icon: "qr_code",
                          title: "Validacioni Ticketing API",
                          desc: "Integracija sa postojećim bar-kod i RFID rampama na vašim kapijama."
                        },
                      ].map(({ href, icon: iconName, title, desc }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setActiveTab(null)}
                          className="flex flex-col gap-1.5 group/sublink"
                        >
                          <span className="text-sm font-black italic uppercase text-slate-200 group-hover/sublink:text-cyan-400 transition-colors flex items-center gap-3">
                            <Icon name={iconName} className="text-[20px] text-cyan-500 shrink-0" />
                            {title}
                          </span>
                          <span className="text-xs text-slate-400 font-medium pl-8 leading-relaxed">
                            {desc}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-6">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none flex items-center gap-2">
                      <Icon name="auto_awesome" className="text-[14px] text-cyan-400" /> Provizija samo 5% po prodatoj karti
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                PANEL 2: KORISNICI PANEL (For Users)
                ========================================== */}
            {activeTab === 2 && (
              <div className="grid grid-cols-12 gap-10 items-stretch">

                {/* Wallet Pass Mockup (Col 1-5) */}
                <div className="col-span-5 flex min-h-[300px]">
                  <div className="w-full bg-slate-950/40 border border-white/5 rounded-[1.75rem] p-7 flex flex-col justify-between relative group/loyalty overflow-hidden shadow-2xl items-center text-center">

                    <div className="w-full max-w-[160px] aspect-[2/3] bg-gradient-to-br from-cyan-600/30 to-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden group-hover/loyalty:scale-[1.03] transition-all duration-500">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider">Splash Club</span>
                        <Icon name="waves" className="text-[12px] text-cyan-400" />
                      </div>

                      <div className="space-y-1.5 my-2">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Članska Kartica</span>
                        <span className="text-xs font-black text-white uppercase italic leading-none">PREMIUM PRO</span>
                      </div>

                      <div className="border-t border-white/10 pt-2.5 flex flex-col items-center">
                        <Icon name="qr_code" className="text-[36px] text-white opacity-85" />
                        <span className="text-[6px] font-mono text-slate-500 mt-1.5">#SPLASH-PASS</span>
                      </div>
                    </div>

                    <Link
                      href="/support"
                      onClick={() => setActiveTab(null)}
                      className="w-full h-12 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg group-hover/loyalty:bg-white transition-all duration-300 mt-4"
                    >
                      Splash Club <Icon name="auto_awesome" className="text-[16px]" />
                    </Link>
                  </div>
                </div>

                {/* User Portal Links (Col 6-12) */}
                <div className="col-span-7 flex flex-col justify-between pl-6">
                  <div>
                    <div className="border-b border-white/5 pb-4 mb-6">
                      <span className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">
                        Korisnički Portal
                      </span>
                    </div>

                    <div className="flex flex-col gap-7">
                      {[
                        {
                          href: "/how-it-works",
                          icon: "explore",
                          title: "Kako funkcioniše platforma?",
                          desc: "Vodič za brzu kupovinu karata i čuvanje u Apple & Google Wallet novčanik."
                        },
                        {
                          href: "/support",
                          icon: "help_outline",
                          title: "Centar za Pomoć & FAQ",
                          desc: "Brzi odgovori na pitanja o refundacijama, slanju ulaznica i radnom vremenu."
                        },
                        {
                          href: "/terms",
                          icon: "verified_user",
                          title: "Pravila i sigurnost kupovine",
                          desc: "Bezbedno 3D Secure procesiranje platnih kartica i zaštita potrošača u Srbiji."
                        },
                      ].map(({ href, icon: iconName, title, desc }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setActiveTab(null)}
                          className="flex flex-col gap-1.5 group/sublink"
                        >
                          <span className="text-sm font-black italic uppercase text-slate-200 group-hover/sublink:text-cyan-400 transition-colors flex items-center gap-3">
                            <Icon name={iconName} className="text-[20px] text-cyan-500 shrink-0" />
                            {title}
                          </span>
                          <span className="text-xs text-slate-400 font-medium pl-8 leading-relaxed">
                            {desc}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-6">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none flex items-center gap-2">
                      <Icon name="waves" className="text-[14px] text-cyan-400 animate-pulse" /> 100% digitalne ulaznice na telefonu
                    </span>
                  </div>
                </div>
              </div>
            )}

            </div>{/* end inner padding wrapper */}
          </div>
        )}
    </div>
  );
}
