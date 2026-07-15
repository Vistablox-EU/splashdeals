"use client";

import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";
import { subscribeToNewsletter } from "@/app/(server)/lib/actions/newsletter";
import { getClientDictionary } from "@/lib/client-dictionaries";
import { cn } from "@/lib/utils";
import type { Dict } from "@/lib/types";

/**
 * 🌊 Footer Component
 * Integrated with Aquastream design system.
 *
 * Client shell loads dictionary + hosts hover/newsletter islands.
 * Brand logo uses the same asset as the header.
 */
export function Footer() {
  const [isHovered, setIsHovered] = React.useState(false);
  const [dict, setDict] = React.useState<Dict | null>(null);

  React.useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  return (
    <footer className="bg-background border-border relative mt-auto overflow-hidden border-t pt-12 pb-8 sm:pt-24 sm:pb-12">
      {/* Background Ambience */}
      <div className="bg-primary/5 pointer-events-none absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full blur-[120px]" />
      <div className="bg-primary/5 pointer-events-none absolute right-1/4 bottom-0 h-[300px] w-[300px] rounded-full blur-[100px]" />

      <div className="relative z-10 container mx-auto px-6">
        <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Logo & Vision Section */}
          <div className="space-y-6">
            <Link
              href="/"
              className="group animate-float mb-4 inline-flex items-center tracking-[-0.08em] select-none [animation-delay:0.5s] hover:[animation-play-state:paused]"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              aria-label={dict?.brand?.logo_aria ?? "Splashdeals početna"}
            >
              <div className="group/logo relative overflow-hidden">
                <Image
                  src="/logo-splashdeals.webp"
                  alt={
                    dict?.brand?.logo_alt ??
                    "SplashDeals - digitalne ulaznice za vodene parkove Srbija"
                  }
                  width={220}
                  height={74}
                  className={cn(
                    "h-10 w-auto object-contain sm:h-12",
                    "transition-[transform,filter] duration-300",
                    isHovered && "scale-105 brightness-110",
                  )}
                />
                {/* ⚡ Composited Glint Overlay */}
                <div className="group-hover/logo:animate-logo-shimmer pointer-events-none absolute inset-0 z-20 translate-x-[-100%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              {/* 🌊 Water Splash Particles — CSS animated on hover */}
              <div
                className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                {[...Array(10)].map((_, i) => (
                  <div
                    key={`foot-drop-${i}`}
                    style={
                      {
                        animation: `splash-particle 0.8s ease-out ${i * 0.01}s forwards`,
                        "--x": `${((i * 37) % 70) - 35}px`,
                        "--y": `${((i * 41) % 60) - 30}px`,
                      } as React.CSSProperties
                    }
                    className="bg-primary absolute top-1/2 left-1/2 h-[5px] w-[5px] rounded-full opacity-0 blur-[1px]"
                  />
                ))}
                {/* Ripple ring */}
                <div
                  style={{ animation: "splash-ripple 0.6s ease-out forwards" }}
                  className="bg-primary/30 absolute inset-0 rounded-xl opacity-0 blur-lg"
                />
              </div>

              <div className="relative mt-3 ml-1">
                <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
                <div className="bg-primary/50 absolute inset-0 h-1.5 w-1.5 animate-ping rounded-full opacity-50 blur-[2px]" />
              </div>
            </Link>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed font-medium">
              {dict?.footer?.desc ||
                "Vodeća destinacija u Srbiji za digitalne ulaznice za akva parkove i sezonske propusnice. Preskočite čekanje i uživajte u letu."}
            </p>
            <div className="flex items-center gap-3">
              {[
                {
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      {...props}
                    >
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  ),
                  label: dict?.footer?.instagram_aria || "Pratite nas na Instagramu",
                  href: "https://www.instagram.com/splashdeals",
                },
                {
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      {...props}
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  ),
                  label: dict?.footer?.facebook_aria || "Pratite nas na Facebooku",
                  href: "https://www.facebook.com/splashdeals.rs/",
                },
                {
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      {...props}
                    >
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    </svg>
                  ),
                  label: dict?.footer?.twitter_aria || "Pratite nas na X (Twitter)",
                  href: "https://x.com/splashdeals",
                },
                {
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      {...props}
                    >
                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    </svg>
                  ),
                  label: dict?.footer?.github_aria || "Pogledajte naš GitHub",
                  href: "https://github.com/splashdeals",
                },
              ].map(({ icon: IconComponent, label, href }, idx) => (
                <Link
                  key={idx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-muted/50 border-border text-muted-foreground hover:text-primary hover:bg-muted hover:border-primary/30 flex h-11 w-11 items-center justify-center rounded-lg border transition-colors duration-300"
                  aria-label={label}
                >
                  <IconComponent className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-foreground mb-8 text-xs font-black tracking-[0.3em] uppercase">
              {dict?.footer?.quick_access || "Brzi Pristup"}
            </h4>
            <ul className="space-y-1">
              {[
                {
                  name: dict?.footer?.featured_parks || "Izdvojeni Parkovi",
                  href: `/akva-parkovi`,
                },
                {
                  name: dict?.footer?.top_destinations || "Najbolje Destinacije",
                  href: `/akva-parkovi`,
                },
                { name: dict?.footer?.how_it_works || "Kako Funkcioniše", href: `/how-it-works` },
                { name: dict?.footer?.support_center || "Centar za Podršku", href: `/support` },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-primary group flex items-center py-3 text-sm font-bold transition-colors"
                  >
                    <Icon
                      name="arrow_forward"
                      className="mr-2 -ml-5 text-[12px] opacity-0 transition-[margin,opacity] group-hover:ml-0 group-hover:opacity-100"
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-foreground mb-8 text-xs font-black tracking-[0.3em] uppercase">
              {dict?.footer?.support_legal || "Podrška i Pravne Informacije"}
            </h4>
            <ul className="space-y-1">
              {[
                { name: dict?.footer?.terms || "Uslovi Usluge", href: `/terms` },
                { name: dict?.footer?.privacy || "Privatnost", href: `/privacy` },
                { name: dict?.footer?.cookie_policy || "Politika Kolačića", href: `/cookies` },
                { name: dict?.footer?.help_center || "Centar za Pomoć", href: `/support` },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-primary group flex items-center py-3 text-sm font-bold transition-colors"
                  >
                    <Icon
                      name="arrow_forward"
                      className="mr-2 -ml-5 text-[12px] opacity-0 transition-[margin,opacity] group-hover:ml-0 group-hover:opacity-100"
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Priority Updates */}
          <div className="space-y-8">
            <div className="bg-muted/50 border-border group relative rounded-2xl border p-6 backdrop-blur-md">
              <div className="from-primary/10 to-primary/5 pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100" />
              <h4 className="text-foreground mb-4 text-xs font-black tracking-widest uppercase">
                {dict?.footer?.summer_alerts || "Letnja Obaveštenja"}
              </h4>
              <p className="text-muted-foreground mb-4 text-xs leading-relaxed font-medium">
                {dict?.footer?.summer_alerts_desc ||
                  "Prijavite se za najnovije akcije i ekskluzivne letnje ponude akva parkova."}
              </p>
              <NewsletterForm dict={dict} />
            </div>

            <div className="space-y-4">
              <div className="text-muted-foreground group flex cursor-default items-center gap-3">
                <div className="bg-muted/50 group-hover:bg-primary/10 rounded-lg p-2 transition-colors">
                  <Icon name="mail" className="group-hover:text-primary text-[16px]" />
                </div>
                <span
                  className="group-hover:text-primary text-xs font-bold transition-colors"
                  dangerouslySetInnerHTML={{
                    __html: "<!--email_off-->hq@splashdeals.rs<!--/email_off-->",
                  }}
                />
              </div>
              <div className="text-muted-foreground group flex cursor-default items-center gap-3">
                <div className="bg-muted/50 group-hover:bg-primary/10 rounded-lg p-2 transition-colors">
                  <Icon name="location_on" className="group-hover:text-primary text-[16px]" />
                </div>
                <span className="group-hover:text-primary text-xs font-bold transition-colors">
                  {dict?.footer?.location_text || "Beograd Technology Park, SRB"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Base */}
        <div className="border-border flex flex-col items-center justify-between gap-6 border-t px-2 pt-12 opacity-80 backdrop-blur-sm md:flex-row">
          <div className="flex flex-col items-center gap-1 md:items-start">
            <p className="text-muted-foreground text-[10px] font-black tracking-[0.2em] uppercase">
              {dict?.footer?.copyright || "© 2026 Splashdeals Marketplace. Sva prava zadržana."}
            </p>
            <p className="text-muted-foreground/60 flex items-center gap-2 text-[9px] font-bold tracking-widest uppercase">
              {dict?.footer?.built_for || "Napravljeno za brzu i laku rezervaciju"}
              <span className="bg-primary h-1 w-1 rounded-full" />
              v2.4.0-letnji
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-muted-foreground text-center text-xs font-bold tracking-widest uppercase">
              {dict?.footer?.best_parks_badge || "Najbolji Akva Parkovi u Srbiji"}
            </div>
            <div className="text-muted-foreground flex items-center gap-4 text-[10px] font-black tracking-widest uppercase">
              <span>{dict?.footer?.security_first || "Sigurnost na Prvom Mestu"}</span>
              <span className="bg-muted-foreground/30 h-1 w-1 rounded-full" />
              <span>{dict?.footer?.instant_delivery || "Trenutna Isporuka"}</span>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="bg-primary h-2 w-2 animate-pulse rounded-full shadow-[0_0_8px_color-mix(in_oklab,var(--primary)_50%,transparent)]" />
              <span className="text-primary text-[10px] font-black tracking-widest uppercase">
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
  );
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
            {dict?.footer?.newsletter_sr || "E-mail adresa za obaveštenja"}
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
            className="bg-muted border-border focus-visible:ring-primary/50 h-10 text-xs"
          />
          {/* Hidden field for source tracking */}
          <input type="hidden" name="source" value="footer" />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex h-11 min-w-[80px] items-center justify-center px-6 text-xs font-black tracking-tighter uppercase transition-opacity disabled:opacity-50"
          aria-label={dict?.footer?.newsletter_aria || "Pretplatite se na obaveštenja"}
        >
          {isPending ? (
            <Icon name="progress_activity" className="animate-spin text-[16px]" />
          ) : state?.success ? (
            <Icon name="check_circle" className="text-[16px]" />
          ) : (
            dict?.footer?.join_button || "Pridruži se"
          )}
        </Button>
      </div>
      {state?.message && (
        <p
          className={cn(
            "mt-2 text-[10px] font-black tracking-widest uppercase transition-opacity duration-300",
            state.success ? "text-primary" : "text-destructive",
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
