import { Icon } from "@/components/ui/Icon";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { JsonLd } from "@/components/SEO/JsonLd";
import Link from "next/link";
import React, { Suspense } from "react";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { Button } from "@/components/ui/button";
import { TicketCardSkeleton } from "@/components/ui/TicketCardSkeleton";
import { TicketGrid } from "./_components/TicketGrid";

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
export default async function LandingPage({ params: _params }: { params: Promise<Record<string, never>> }) {
  await connection();
  const dict = await getDictionary();

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SplashDeals",
    "url": "https://www.splashdeals.rs",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.splashdeals.rs/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SplashDeals",
    "url": "https://www.splashdeals.rs",
    "logo": "https://www.splashdeals.rs/og-image.png",
    "description": "Splashdeals je prvi srpski marketplace za digitalne ulaznice za vodene parkove, bazene i wellness centre. Preskočite redove na blagajni — kupite karte instant, direktno sa svog telefona.",
    "areaServed": {
      "@type": "Country",
      "name": "RS"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+381-61-138-4512",
        "contactType": "customer service",
        "availableLanguage": ["Serbian"]
      },
      {
        "@type": "ContactPoint",
        "email": "hq@splashdeals.rs",
        "contactType": "customer service",
        "availableLanguage": ["Serbian"]
      }
    ],
    "sameAs": [
      "https://www.facebook.com/splashdeals.rs/",
      "https://www.instagram.com/splashdeals",
      "https://x.com/splashdeals",
      "https://www.google.com/maps/place/SplashDeals/"
    ]
  };

  return (
    <div className="relative min-h-screen text-foreground selection:bg-primary/30 overflow-x-hidden">
      <JsonLd id="website-schema" data={websiteSchema} />
      <JsonLd id="organization-schema" data={organizationSchema} />
      
      {/* 🏙️ HERO SECTION 2.0 */}
      <div className="relative z-0 w-full overflow-hidden pb-20">
        <section className="relative pt-28 pb-8 px-6 sm:px-12 max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center">

            <div
              className="transition-all duration-300"
            >
              <h1 className="text-[clamp(3.5rem,12vw,10rem)] font-black tracking-tighter mb-12 leading-[0.85] bg-gradient-to-b from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
                {dict.home.title_digital} <br className="hidden sm:block" />
                <span className="text-primary italic">{dict.home.title_splash}</span>
              </h1>
            </div>
            
            <p 
              className="text-[clamp(1.125rem,3vw,1.5rem)] text-muted-foreground max-w-3xl mx-auto mb-16 font-medium leading-relaxed transition-opacity duration-1000"
            >
              {dict.home.subtitle}
            </p>
  
            <div
              className="flex flex-col sm:flex-row gap-6 items-center cursor-pointer transition-all duration-800"
            >
              <Button className="px-12 py-6 min-w-[240px] bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                <Link href="#inventory" className="flex items-center justify-center gap-2 w-full h-full">
                  {dict.home.facilities_btn}
                  <Icon name="arrow_forward" className="text-[20px] transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              
              <Link 
                href={`/how-it-works`}
                className="text-xs font-black uppercase tracking-[.25em] text-muted-foreground hover:text-foreground transition-colors py-4 px-8"
              >
                {dict.home.how_it_works}
              </Link>
            </div>
          </div>
        </section>

        {/* 🌊 SVG Wave Animation */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-0 opacity-40 pointer-events-none select-none">
          <style dangerouslySetInnerHTML={{ __html: `
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
          `}} />
          <svg 
            className="relative block w-[calc(150%+1.3px)] h-[120px]" 
            preserveAspectRatio="none" 
            shapeRendering="auto" 
            viewBox="0 24 150 28" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <path d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" id="gentle-wave" />
            </defs>
            <g className="wave-layer">
              <use href="#gentle-wave" x="48" y="0" fill="rgba(34, 211, 238, 0.2)" />
              <use href="#gentle-wave" x="48" y="3" fill="rgba(6, 182, 214, 0.3)" />
              <use href="#gentle-wave" x="48" y="5" fill="rgba(34, 211, 238, 0.5)" />
              <use href="#gentle-wave" x="48" y="7" fill="#06b6d4" />
            </g>
          </svg>
        </div>
      </div>

      {/* 🌊 INVENTORY GRID (NOW HIGHER) */}
      <section id="inventory" className="px-6 md:px-12 max-w-7xl mx-auto pb-40 scroll-mt-32">
        <div className="flex items-end justify-between mb-16 border-b border-border pb-8">
            <div>
              <h2 className="text-4xl font-black tracking-tighter uppercase mb-2 italic">{dict.home.offers_title}</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em]">{dict.home.offers_subtitle}</p>
           </div>
           <div className="hidden sm:block text-[10px] font-black text-primary/50 uppercase tracking-[0.4em]">
              {dict.home.rights_reserved}
           </div>
        </div>

        <Suspense fallback={
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <TicketCardSkeleton key={i} />
            ))}
          </div>
        }>
          <TicketGrid dict={dict} />
        </Suspense>
      </section>

      {/* 🏄 HOW IT WORKS (SIMPLE & FAST) */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto py-32 border-t border-border">
        <div className="text-center mb-20">
          <h2 className="text-[clamp(2.25rem,8vw,4.5rem)] font-black italic uppercase tracking-tighter mb-4 leading-[0.9]">
            {dict.home.steps_title_base}<span className="text-primary">{dict.home.steps_title_highlight}</span>
          </h2>
          <p className="text-muted-foreground font-medium">{dict.home.steps_subtitle}</p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { step: "01", title: dict.home.step1_title, desc: dict.home.step1_desc, icon: "location_on" },
            { step: "02", title: dict.home.step2_title, desc: dict.home.step2_desc, icon: "shopping_bag" },
            { step: "03", title: dict.home.step3_title, desc: dict.home.step3_desc, icon: "bolt" }
          ].map((item, idx) => (
            <li key={idx} className="relative group text-center md:text-left">
              <div className="text-8xl font-black text-foreground/5 absolute -top-12 -left-4 group-hover:text-primary/10 transition-colors pointer-events-none select-none">
                {item.step}
              </div>
              <div className="relative z-10">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 mx-auto md:mx-0 group-hover:bg-primary/20 transition-colors">
                  <Icon name={item.icon} className="text-[32px] text-primary" />
                </div>
                <h3 className="text-2xl font-black uppercase italic mb-4 tracking-tight">{item.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto md:mx-0">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 🚀 SOCIAL PROOF & CONVENIENCE */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto py-32 border-t border-border">
        <div className="text-center mb-20">
          <h2 
            className="text-[clamp(2.25rem,8vw,4.5rem)] font-black italic uppercase tracking-tighter mb-6 leading-[0.9] transition-all duration-700"
          >
            {dict.home.experience_title_base}<span className="text-primary">{dict.home.experience_title_highlight}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            {dict.home.experience_desc}
          </p>
        </div>

        <StatsGrid 
          stats={[
            { id: "1", label: dict.home.stat1_label, value: "15", suffix: "k+", sublabel: dict.home.stat1_sub },
            { id: "2", label: dict.home.stat2_label, value: "0", suffix: "s", sublabel: dict.home.stat2_sub },
            { id: "3", label: dict.home.stat3_label, value: "42", suffix: "", sublabel: dict.home.stat3_sub },
            { id: "4", label: dict.home.stat4_label, value: "24", suffix: "/7", sublabel: dict.home.stat4_sub }
          ]}
        />
      </section>
    </div>
  );
}
