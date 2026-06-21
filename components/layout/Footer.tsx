"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useActionState } from "react"
import { subscribeToNewsletter } from "@/server/lib/actions/newsletter"
import { getClientDictionary } from "@/lib/client-dictionaries"
import type { Dict } from "@/lib/types"


/**
 * 🌊 Footer Component
 * Integrated with Aquastream design system.
 */
export function Footer() {
  const [isHovered, setIsHovered] = React.useState(false)
  const [dict, setDict] = React.useState<Dict | null>(null)

  React.useEffect(() => {
    getClientDictionary().then(setDict)
  }, [])

  return (
    <footer className="relative mt-auto pt-12 sm:pt-24 pb-8 sm:pb-12 overflow-hidden bg-background border-t border-border">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="container px-6 mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          
          {/* Logo & Vision Section */}
          <div className="space-y-6">
            <Link 
              href={``} 
              className="inline-flex items-center tracking-[-0.08em] select-none mb-4 group animate-float [animation-delay:0.5s] hover:[animation-play-state:paused]"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="relative overflow-hidden group/logo">
                <span className="text-3xl font-black italic uppercase text-splash relative z-10">
                  Splash
                </span>
                {/* ⚡ Composited Glint Overlay */}
                <div className="absolute inset-0 z-20 pointer-events-none translate-x-[-100%] group-hover/logo:animate-logo-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
              </div>

              {/* 🌊 Water Splash Particles — CSS animated on hover */}
              <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                {[...Array(10)].map((_, i) => (
                  <div
                    key={`foot-drop-${i}`}
                    style={{
                      animation: `splash-particle 0.8s ease-out ${i * 0.01}s forwards`,
                      "--x": `${((i * 37) % 70) - 35}px`,
                      "--y": `${((i * 41) % 60) - 30}px`,
                    } as React.CSSProperties}
                    className="absolute top-1/2 left-1/2 w-[5px] h-[5px] bg-cyan-400 rounded-full blur-[1px] opacity-0"
                  />
                ))}
                {/* Ripple ring */}
                <div
                  style={{ animation: "splash-ripple 0.6s ease-out forwards" }}
                  className="absolute inset-0 bg-cyan-400/30 rounded-xl blur-lg opacity-0"
                />
              </div>

              <span className="text-3xl font-black italic uppercase text-foreground group-hover:text-primary transition-colors -ml-1">

                deals
              </span>
              <div className="relative ml-1 mt-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-cyan-400 blur-[2px] animate-ping opacity-50" />
              </div>
            </Link>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-xs">
              {dict?.footer?.desc || "Vodeća destinacija u Srbiji za digitalne ulaznice za akva parkove i sezonske propusnice. Preskočite čekanje i uživajte u letu."}
            </p>
            <div className="flex items-center gap-3">
              {[
                { 
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  ), 
                  label: "Pratite nas na Instagramu", 
                  href: "https://www.instagram.com/splashdeals" 
                },
                { 
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  ), 
                  label: "Pratite nas na Facebooku", 
                  href: "https://www.facebook.com/splashdeals.rs/" 
                },
                { 
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                  ), 
                  label: "Pratite nas na X (Twitter)", 
                  href: "https://x.com/splashdeals" 
                },
                { 
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/></svg>
                  ), 
                  label: "Pogledajte naš GitHub", 
                  href: "https://github.com/splashdeals" 
                }
              ].map(({ icon: IconComponent, label, href }, idx) => (
                <Link 
                  key={idx} 
                  href={href} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted hover:border-primary/30 transition-all duration-300"
                  aria-label={label}
                >
                  <IconComponent className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-foreground font-black uppercase text-xs tracking-[0.3em] mb-8">
              {dict?.footer?.quick_access || "Brzi Pristup"}
            </h4>
            <ul className="space-y-1">
              {[
                { name: dict?.footer?.featured_parks || "Izdvojeni Parkovi", href: `/facilities` },
                { name: dict?.footer?.top_destinations || "Najbolje Destinacije", href: `/facilities/waterpark` },
                { name: dict?.footer?.how_it_works || "Kako Funkcioniše", href: `/how-it-works` },
                { name: dict?.footer?.support_center || "Centar za Podršku", href: `/support` }
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-muted-foreground hover:text-primary text-sm font-bold transition-colors flex items-center group py-3">
                    <Icon name="arrow_forward" className="text-[12px] mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-black uppercase text-xs tracking-[0.3em] mb-8">
              {dict?.footer?.support_legal || "Podrška i Pravne Informacije"}
            </h4>
            <ul className="space-y-1">
              {[
                { name: dict?.footer?.terms || "Uslovi Usluge", href: `/terms` },
                { name: dict?.footer?.privacy || "Privatnost", href: `/privacy` },
                { name: dict?.footer?.cookie_policy || "Politika Kolačića", href: `/cookies` },
                { name: dict?.footer?.help_center || "Centar za Pomoć", href: `/support` }
              ].map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-muted-foreground hover:text-primary text-sm font-bold transition-colors flex items-center group py-3">
                    <Icon name="arrow_forward" className="text-[12px] mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Priority Updates */}
          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-muted/50 border border-border backdrop-blur-md relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
              <h4 className="text-foreground font-black uppercase text-xs tracking-widest mb-4">
                {dict?.footer?.summer_alerts || "Letnja Obaveštenja"}
              </h4>
              <p className="text-muted-foreground text-xs mb-4 font-medium leading-relaxed">
                {dict?.footer?.summer_alerts_desc || "Prijavite se za najnovije akcije i ekskluzivne letnje ponude akva parkova."}
              </p>
              <NewsletterForm dict={dict} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground group cursor-default">
                <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                  <Icon name="mail" className="text-[16px] group-hover:text-primary" />
                </div>
                <span 
                  className="text-xs font-bold transition-colors group-hover:text-primary"
                  dangerouslySetInnerHTML={{ __html: "<!--email_off-->hq@splashdeals.rs<!--/email_off-->" }}
                />
              </div>
              <div className="flex items-center gap-3 text-muted-foreground group cursor-default">
                <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                  <Icon name="location_on" className="text-[16px] group-hover:text-primary" />
                </div>
                <span className="text-xs font-bold transition-colors group-hover:text-primary">Belgrade Technology Park, SRB</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Base */}
        <div className="pt-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6 opacity-80 backdrop-blur-sm px-2">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">
              {dict?.footer?.copyright || "© 2026 Splashdeals Marketplace. Sva prava zadržana."}
            </p>
            <p className="text-muted-foreground/60 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
              {dict?.footer?.built_for || "Napravljeno za brzu i laku rezervaciju"} 
              <span className="w-1 h-1 rounded-full bg-primary" /> 
              v2.4.0-letnji
            </p>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="text-center text-muted-foreground text-xs font-bold uppercase tracking-widest">
              Najbolji Akva Parkovi u Srbiji
            </div>
            <div className="flex items-center gap-4 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              <span>{dict?.footer?.security_first || "Sigurnost na Prvom Mestu"}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>{dict?.footer?.instant_delivery || "Trenutna Isporuka"}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                {dict?.footer?.marketplace_online || "Marketplace na Mreži"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS keyframes for splash particles */}
      <style>{`
        @keyframes splash-particle {
          0% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(var(--x, 0), var(--y, 0)); }
          100% { opacity: 0; transform: scale(0.4) translate(var(--x, 0), var(--y, 0)); }
        }
        @keyframes splash-ripple {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.4; transform: scale(2.5); }
          100% { opacity: 0; transform: scale(2.5); }
        }
      `}</style>
    </footer>
  )
}

/**
 * 📧 Newsletter Form Sub-component
 * Uses Server Actions & React 19 useActionState
 */
function NewsletterForm({ dict }: { dict: Dict | null }) {
  const [state, formAction, isPending] = useActionState(subscribeToNewsletter, null);
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    if (state?.success) {
      // Reset email on success — this runs after render but is safe for form state
      setTimeout(() => setEmail(""));
    }
  }, [state]);

  return (
    <form action={formAction}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor="newsletter-email" className="sr-only">
            E-mail adresa za obaveštenja
          </label>
          <Input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={dict?.footer?.email_placeholder || "Vaša E-mail adresa"}
            className="bg-muted border-border focus-visible:ring-primary/50 text-xs h-10"
          />
          {/* Hidden field for source tracking */}
          <input type="hidden" name="source" value="footer" />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-tighter h-11 px-6 min-w-[80px] disabled:opacity-50 transition-all flex items-center justify-center"
          aria-label="Pretplatite se na obaveštenja"
        >
          {isPending ? (
            <Icon name="progress_activity" className="text-[16px] animate-spin" />
          ) : state?.success ? (
            <Icon name="check_circle" className="text-[16px] " />
          ) : (
            dict?.footer?.join_button || "Pridruži se"
          )}
        </Button>
      </div>
      {state?.message && (
        <p 
          className={`text-[10px] mt-2 font-black uppercase tracking-widest transition-all duration-300 ${
            state.success ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
