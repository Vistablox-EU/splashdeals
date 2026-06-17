import { Icon } from "@/components/ui/Icon";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { connection } from "next/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { JsonLd } from "@/components/SEO/JsonLd";

interface PageProps {
  params: Promise<Record<string, never>>;
}

export async function generateMetadata({ params: _params }: PageProps): Promise<Metadata> {
  return {
    title: "Uslovi Korišćenja i Pravna Pravila | Splashdeals",
    description: "Pročitajte zvanične uslove korišćenja platforme Splashdeals.rs. Saznajte više o pravima korisnika, načinu plaćanja i zaštiti kupaca karata.",
    alternates: { canonical: "https://www.splashdeals.rs/terms" },
    openGraph: {
      title: "Uslovi Korišćenja i Pravna Pravila | Splashdeals",
      description: "Pročitajte zvanične uslove korišćenja platforme Splashdeals.rs. Saznajte više o pravima korisnika, načinu plaćanja i zaštiti kupaca karata.",
      images: ["/og-image.png"],
      locale: "sr_RS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Uslovi Korišćenja i Pravna Pravila | Splashdeals",
      description: "Pročitajte zvanične uslove korišćenja platforme Splashdeals.rs. Saznajte više o pravima korisnika, načinu plaćanja i zaštiti kupaca karata.",
      images: ["/og-image.png"],
    },
  };
}

export default async function TermsPage({ params: _params }: PageProps) {
  
  const dict = await getDictionary();
  await connection();

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `https://www.splashdeals.rs/terms`,
    "name": dict.terms.title,
    "description": dict.terms.intro,
    "isPartOf": {
      "@id": "https://www.splashdeals.rs/#website"
    },
  };

  const sections = [
    { title: dict.terms.section1_title, content: dict.terms.section1_content },
    { title: dict.terms.section2_title, content: dict.terms.section2_content },
    { title: dict.terms.section3_title, content: dict.terms.section3_content },
    { title: dict.terms.section4_title, content: dict.terms.section4_content },
    { title: dict.terms.section5_title, content: dict.terms.section5_content },
    { title: dict.terms.section6_title, content: dict.terms.section6_content },
    { title: dict.terms.section7_title, content: dict.terms.section7_content },
  ];

  return (
    <>
      <JsonLd data={webpageSchema} id="webpage-schema" />
      <div className="min-h-screen pb-32 pt-32 px-6 sm:px-12 max-w-5xl mx-auto">
      {/* 🏙️ HEADER */}
      <header className="mb-20">
        <div 
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Icon name="description" className="text-[20px] text-cyan-400" />
            </div>
            <span className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
              {dict.terms.eyebrow || "Pravni Okvir"}
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] text-white">
            {dict.terms.title}
          </h1>
          
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span>{dict.terms.updated}</span>
            <div className="h-1 w-1 rounded-full bg-slate-800" />
            <span>SplashDeals.rs</span>
          </div>
        </div>
      </header>

      {/* 📜 CONTENT GRID */}
      <div className="space-y-12">
        <div
          className="text-lg text-slate-300 leading-relaxed font-medium transition-opacity duration-500"
        >
          {dict.terms.intro}
        </div>

        <div className="grid gap-8">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="transition-all duration-300"
            >
              <GlassCard className="p-8 border-white/5 hover:border-cyan-500/20 transition-colors group">
                <h2 className="text-xl font-black uppercase italic tracking-tight text-white mb-6 flex items-center gap-3">
                  <Icon name="keyboard_arrow_right" className="text-[20px] text-cyan-500 group-hover:translate-x-1 transition-transform" />
                  {section.title}
                </h2>
                <div className="text-slate-400 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                  {section.content}
                </div>
              </GlassCard>
            </div>
          ))}
        </div>

        {/* 📧 CONTACT SECTION */}
        <div
          className="transition-all duration-500"
        >
          <GlassCard className="p-8 border-cyan-500/20 bg-cyan-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                  <Icon name="mail" className="text-[20px] text-cyan-500" />
                  {dict.terms.contact_title}
                </h3>
                <p className="text-slate-400 text-sm" dangerouslySetInnerHTML={{ __html: dict.terms.contact_content }} />
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                <Icon name="security" className="text-[12px]" />
                {dict.terms.legal_badge || "Verifikovani Pravni Protokol"}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
    </>
  );
}
