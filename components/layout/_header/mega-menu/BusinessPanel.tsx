"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";


interface BusinessPanelProps {
  dict: any;
  onClose: () => void;
}

export function BusinessPanel({ dict, onClose }: BusinessPanelProps) {
  return (
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
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Validirano
              </span>
            </div>
          </div>

          <Link
            href="/facilities"
            onClick={onClose}
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
                desc: "Predstavite svoj bazen ili akva park stotinama hiljada aktivnih korisnika u Srbiji.",
              },
              {
                href: "/admin/facilities",
                icon: "verified_user",
                title: "Partner Portal (Admin)",
                desc: "Upravljajte ponudama, pratite skeniranja i vršite isplate direktno preko Stripe panela.",
              },
              {
                href: "/support",
                icon: "qr_code",
                title: "Validacioni Ticketing API",
                desc: "Integracija sa postojećim bar-kod i RFID rampama na vašim kapijama.",
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
            <Icon name="auto_awesome" className="text-[14px] text-cyan-400" />{" "}
            Provizija samo 5% po prodatoj karti
          </span>
        </div>
      </div>
    </div>
  );
}
