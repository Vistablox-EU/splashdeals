import { Icon } from "@/components/ui/Icon";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { connection } from "next/server";
import Link from "next/link";
import { JsonLd } from "@/components/SEO/JsonLd";

interface PageProps {
  params: Promise<Record<string, never>>;
}

export async function generateMetadata({ params: _params }: PageProps): Promise<Metadata> {
  return {
    title: "Kako kupiti digitalne karte za akva parkove | Splashdeals",
    description: "Saznajte kako da u 3 jednostavna koraka kupite online karte za akva parkove u Srbiji, preskočite čekanje na ulazu i uživate u letu bez stresa.",
    alternates: { canonical: "https://www.splashdeals.rs/how-it-works" },
    openGraph: {
      title: "Kako kupiti digitalne karte za akva parkove | Splashdeals",
      description: "Saznajte kako da u 3 jednostavna koraka kupite online karte za akva parkove u Srbiji, preskočite čekanje na ulazu i uživate u letu bez stresa.",
      images: ["/og-image.png"],
      locale: "sr_RS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Kako kupiti digitalne karte za akva parkove | Splashdeals",
      description: "Saznajte kako da u 3 jednostavna koraka kupite online karte za akva parkove u Srbiji, preskočite čekanje na ulazu i uživate u letu bez stresa.",
      images: ["/og-image.png"],
    },
  };
}

import { HowItWorksSteps } from "./_components/HowItWorksSteps";

export default async function HowItWorksPage({ params: _params }: PageProps) {
  
  const dict = await getDictionary();
  await connection();

  const steps = [
    { 
      title: dict.how_it_works_page.step1_title, 
      content: dict.how_it_works_page.step1_content,
      icon: "search",
      color: "text-cyan-400",
      bg: "bg-cyan-400/10"
    },
    { 
      title: dict.how_it_works_page.step2_title, 
      content: dict.how_it_works_page.step2_content,
      icon: "credit_card",
      color: "text-teal-400",
      bg: "bg-teal-400/10"
    },
    { 
      title: dict.how_it_works_page.step3_title, 
      content: dict.how_it_works_page.step3_content,
      icon: "confirmation_number",
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
  ];

  return (
    <div className="min-h-screen pb-32 pt-32 px-6 sm:px-12 max-w-5xl mx-auto">
      <JsonLd 
        id="how-it-works-schema"
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "Kako kupiti digitalne karte za akva parkove",
          "description": "Saznajte kako da u 3 jednostavna koraka kupite online karte za akva parkove u Srbiji.",
          "step": steps.map((step, index) => ({
            "@type": "HowToStep",
            "position": index + 1,
            "name": step.title,
            "text": step.content,
          }))
        }} 
      />
      {/* 🏙️ HEADER */}
      <header className="mb-20 text-center sm:text-left">
        <div 
          className="space-y-6"
        >
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Icon name="check_circle" className="text-[20px] text-cyan-400" />
            </div>
            <span className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em]">
              The Splash Protocol
            </span>
          </div>

          <h1 className="text-5xl sm:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] text-white">
            {dict.how_it_works_page.title}
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl font-medium">
            {dict.how_it_works_page.intro}
          </p>
        </div>
      </header>

      {/* 📜 STEPS GRID */}
      <HowItWorksSteps steps={steps} />

      {/* 🚀 CTA SECTION */}
      <div
        className="text-center transition-all duration-700"
      >
        <Link 
          href={`/facilities`}
          className="inline-flex items-center gap-4 px-10 py-5 rounded-2xl bg-cyan-500 text-slate-950 font-black uppercase italic tracking-tighter text-xl hover:bg-cyan-400 hover:scale-105 transition-all active:scale-95 shadow-[0_0_40px_rgba(6,182,212,0.3)]"
        >
          {dict.how_it_works_page.cta}
          <Icon name="arrow_forward" className="text-[24px]" />
        </Link>
      </div>
    </div>
  );
}
