"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";


interface UsersPanelProps {
  dict: any;
  onClose: () => void;
}

export function UsersPanel({ dict, onClose }: UsersPanelProps) {
  return (
    <div className="grid grid-cols-12 gap-10 items-stretch">
      {/* Wallet Pass Mockup (Col 1-5) */}
      <div className="col-span-5 flex min-h-[300px]">
        <div className="w-full bg-slate-950/40 border border-white/5 rounded-[1.75rem] p-7 flex flex-col justify-between relative group/loyalty overflow-hidden shadow-2xl items-center text-center">
          <div className="w-full max-w-[160px] aspect-[2/3] bg-gradient-to-br from-cyan-600/30 to-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden group-hover/loyalty:scale-[1.03] transition-all duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider">
                Splash Club
              </span>
              <Icon name="waves" className="text-[12px] text-cyan-400" />
            </div>

            <div className="space-y-1.5 my-2">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                Članska Kartica
              </span>
              <span className="text-xs font-black text-white uppercase italic leading-none">
                PREMIUM PRO
              </span>
            </div>

            <div className="border-t border-white/10 pt-2.5 flex flex-col items-center">
              <Icon name="qr_code" className="text-[36px] text-white opacity-85" />
              <span className="text-[6px] font-mono text-slate-500 mt-1.5">
                #SPLASH-PASS
              </span>
            </div>
          </div>

          <Link
            href="/support"
            onClick={onClose}
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
                desc: "Vodič za brzu kupovinu karata i čuvanje u Apple & Google Wallet novčanik.",
              },
              {
                href: "/support",
                icon: "help_outline",
                title: "Centar za Pomoć & FAQ",
                desc: "Brzi odgovori na pitanja o refundacijama, slanju ulaznica i radnom vremenu.",
              },
              {
                href: "/terms",
                icon: "verified_user",
                title: "Pravila i sigurnost kupovine",
                desc: "Bezbedno 3D Secure procesiranje platnih kartica i zaštita potrošača u Srbiji.",
              },
            ].map(({ href, icon: iconName, title, desc }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex flex-col gap-1.5 group/sublink"
              >
                <span className="text-sm font-black italic uppercase text-slate-200 group-hover/sublink:text-cyan-400 transition-colors flex items-center gap-3">
                  <Icon
                    name={iconName}
                    className="text-[20px] text-cyan-500 shrink-0"
                  />
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
            <Icon name="waves" className="text-[14px] text-cyan-400 animate-pulse" />{" "}
            100% digitalne ulaznice na telefonu
          </span>
        </div>
      </div>
    </div>
  );
}
