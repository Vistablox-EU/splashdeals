import { Icon } from "@/components/ui/Icon";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { JsonLd } from "@/components/SEO/JsonLd";
import Link from "next/link";
import React, { Suspense } from "react";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { Button } from "@/components/ui/button";
import { TicketCardSkeleton } from "@/components/ui/TicketCardSkeleton";
import { TicketGrid } from "./ticketing/_components/TicketGrid";

interface PageProps {
  params: Promise<Record<string, never>>;
}

export async function generateMetadata({ params: _params }: PageProps): Promise<Metadata> {
  const dict = await getDictionary();

  return {
    title: { absolute: dict.seo.home.title },
    description: dict.seo.home.description,
    alternates: { canonical: "https://www.splashdeals.rs" },
    openGraph: {
      title: dict.seo.home.title,
      description: dict.seo.home.description,
      images: ["/og-image.png"],
      type: "website",
      locale: "sr_RS",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.seo.home.title,
      description: dict.seo.home.description,
      images: ["/og-image.png"],
    },
  };
}

import { connection } from "next/server";

/**
 * 🌊 Landing Portal (Aquastream Pro Max)
 */
export default async function LandingPage({
  params: _params,
}: {
  params: Promise<Record<string, never>>;
}) {
  await connection();
  const dict = await getDictionary();

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SplashDeals",
    url: "https://www.splashdeals.rs",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.splashdeals.rs/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SplashDeals",
    url: "https://www.splashdeals.rs",
    logo: "https://www.splashdeals.rs/logo-splashdeals.webp",
    description:
      "Splashdeals je prvi srpski marketplace za digitalne ulaznice za vodene parkove, bazene i wellness centre. Preskočite redove na blagajni — kupite karte instant, direktno sa svog telefona.",
    areaServed: {
      "@type": "Country",
      name: "RS",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+381-61-138-4512",
        contactType: "customer service",
        availableLanguage: ["Serbian"],
      },
      {
        "@type": "ContactPoint",
        email: "hq@splashdeals.rs",
        contactType: "customer service",
        availableLanguage: ["Serbian"],
      },
    ],
    sameAs: [
      "https://www.facebook.com/splashdeals.rs/",
      "https://www.instagram.com/splashdeals",
      "https://x.com/splashdeals",
      "https://www.google.com/maps/place/SplashDeals/",
    ],
  };

  return (
    <div className="text-foreground selection:bg-primary/30 relative min-h-screen overflow-x-hidden">
      <JsonLd id="website-schema" data={websiteSchema} />
      <JsonLd id="organization-schema" data={organizationSchema} />

      {/* 🏙️ HERO SECTION 2.0 */}
      <div className="relative z-0 w-full overflow-hidden pb-20">
        <section className="relative mx-auto max-w-7xl px-6 pt-28 pb-8 sm:px-12">
          <div className="flex flex-col items-center text-center">
            <div className="transition-all duration-300">
              <h1 className="from-foreground via-foreground/90 to-foreground/60 mb-8 bg-gradient-to-b bg-clip-text text-[clamp(3.5rem,12vw,10rem)] leading-[0.85] font-black tracking-tighter text-transparent sm:mb-12">
                {dict.home.title_digital} <br className="hidden sm:block" />
                <span className="text-primary italic">{dict.home.title_splash}</span>
              </h1>
            </div>

            <p className="text-muted-foreground mx-auto mb-10 max-w-3xl text-[clamp(1.125rem,3vw,1.5rem)] leading-relaxed font-medium transition-opacity duration-1000 sm:mb-16">
              {dict.home.subtitle}
            </p>

            <div className="flex cursor-pointer flex-col items-center gap-6 transition-all duration-800 sm:flex-row">
              <Button
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[240px] rounded-full px-12 py-6"
              >
                <Link
                  href="#inventory"
                  className="flex h-full w-full items-center justify-center gap-2"
                >
                  {dict.home.facilities_btn}
                  <Icon
                    name="arrow_forward"
                    className="text-[20px] transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </Button>

              <Link
                href={`/how-it-works`}
                className="text-muted-foreground hover:text-foreground px-8 py-4 text-xs font-black tracking-[.25em] uppercase transition-colors"
              >
                {dict.home.how_it_works}
              </Link>
            </div>
          </div>
        </section>

        {/* 🌊 SVG Wave Animation */}
        <div className="pointer-events-none absolute bottom-0 left-0 z-0 w-full overflow-hidden leading-[0] opacity-40 select-none">
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes waveFlow {
              0% { transform: translate3d(-90px, 0, 0); }
              100% { transform: translate3d(85px, 0, 0); }
            }
            .wave-layer > use {
              animation: waveFlow 25s cubic-bezier(.55,.5,.45,.5) infinite;
            }
            .wave-layer > use:nth-child(1) { animation-delay: -2s; animation-duration: 7s; }
            .wave-layer > use:nth-child(2) { animation-delay: -3s; animation-duration: 10s; }
            .wave-layer > use:nth-child(3) { animation-delay: -4s; animation-duration: 13s; }
            .wave-layer > use:nth-child(4) { animation-delay: -5s; animation-duration: 20s; }
          `,
            }}
          />
          <svg
            className="relative block h-[120px] w-[calc(150%+1.3px)]"
            preserveAspectRatio="none"
            shapeRendering="auto"
            viewBox="0 24 150 28"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <path
                d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
                id="gentle-wave"
              />
            </defs>
            <g className="wave-layer">
              <use
                href="#gentle-wave"
                x="48"
                y="0"
                fill="currentColor"
                className="text-primary/20"
              />
              <use
                href="#gentle-wave"
                x="48"
                y="3"
                fill="currentColor"
                className="text-primary/30"
              />
              <use
                href="#gentle-wave"
                x="48"
                y="5"
                fill="currentColor"
                className="text-primary/50"
              />
              <use href="#gentle-wave" x="48" y="7" fill="currentColor" className="text-primary" />
            </g>
          </svg>
        </div>
      </div>

      {/* 🌊 INVENTORY GRID (EDGE-TO-EDGE) */}
      <section id="inventory" className="scroll-mt-32 pb-16 sm:pb-40">
        {/* Heading — stays constrained */}
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="border-border mb-8 flex items-end justify-between border-b pb-8 sm:mb-16">
            <div>
              <h2 className="mb-2 text-4xl font-black tracking-tighter uppercase italic">
                {dict.home.offers_title}
              </h2>
              <p className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase">
                {dict.home.offers_subtitle}
              </p>
            </div>
            <div className="text-primary/50 hidden text-[10px] font-black tracking-[0.4em] uppercase sm:block">
              {dict.home.rights_reserved}
            </div>
          </div>
        </div>

        {/* Grid — full-width with generous padding */}
        <div className="px-6 lg:px-16">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                  <TicketCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <TicketGrid dict={dict} />
          </Suspense>
        </div>
      </section>

      {/* 🏄 HOW IT WORKS (SIMPLE & FAST) */}
      <section className="border-border mx-auto max-w-7xl border-t px-6 py-12 sm:py-32 md:px-12">
        <div className="mb-10 text-center sm:mb-20">
          <h2 className="mb-4 text-[clamp(2.25rem,8vw,4.5rem)] leading-[0.9] font-black tracking-tighter uppercase italic">
            {dict.home.steps_title_base}
            <span className="text-primary">{dict.home.steps_title_highlight}</span>
          </h2>
          <p className="text-muted-foreground font-medium">{dict.home.steps_subtitle}</p>
        </div>

        <ol className="grid grid-cols-1 gap-8 sm:gap-12 md:grid-cols-3">
          {[
            {
              step: "01",
              title: dict.home.step1_title,
              desc: dict.home.step1_desc,
              icon: "location_on",
            },
            {
              step: "02",
              title: dict.home.step2_title,
              desc: dict.home.step2_desc,
              icon: "shopping_bag",
            },
            { step: "03", title: dict.home.step3_title, desc: dict.home.step3_desc, icon: "bolt" },
          ].map((item, idx) => (
            <li key={idx} className="group relative text-center md:text-left">
              <div className="text-foreground/5 group-hover:text-primary/10 pointer-events-none absolute -top-12 -left-4 text-8xl font-black transition-colors select-none">
                {item.step}
              </div>
              <div className="relative z-10">
                <div className="bg-primary/10 group-hover:bg-primary/20 mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors md:mx-0">
                  <Icon name={item.icon} className="text-primary text-[32px]" />
                </div>
                <h3 className="mb-4 text-2xl font-black tracking-tight uppercase italic">
                  {item.title}
                </h3>
                <p className="text-muted-foreground mx-auto max-w-xs leading-relaxed font-medium md:mx-0">
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 🚀 SOCIAL PROOF & CONVENIENCE */}
      <section className="border-border mx-auto max-w-7xl border-t px-6 py-12 sm:py-32 md:px-12">
        <div className="mb-10 text-center sm:mb-20">
          <h2 className="mb-6 text-[clamp(2.25rem,8vw,4.5rem)] leading-[0.9] font-black tracking-tighter uppercase italic transition-all duration-700">
            {dict.home.experience_title_base}
            <span className="text-primary">{dict.home.experience_title_highlight}</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed">
            {dict.home.experience_desc}
          </p>
        </div>

        <StatsGrid
          stats={[
            {
              id: "1",
              label: dict.home.stat1_label,
              value: "15",
              suffix: "k+",
              sublabel: dict.home.stat1_sub,
            },
            {
              id: "2",
              label: dict.home.stat2_label,
              value: "0",
              suffix: "s",
              sublabel: dict.home.stat2_sub,
            },
            {
              id: "3",
              label: dict.home.stat3_label,
              value: "42",
              suffix: "",
              sublabel: dict.home.stat3_sub,
            },
            {
              id: "4",
              label: dict.home.stat4_label,
              value: "24",
              suffix: "/7",
              sublabel: dict.home.stat4_sub,
            },
          ]}
        />
      </section>
    </div>
  );
}
