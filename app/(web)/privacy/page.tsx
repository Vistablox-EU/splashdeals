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
    title: "Politika Privatnosti i Zaštita Podataka | Splashdeals",
    description: "Vaša privatnost nam je na prvom mestu. Saznajte kako Splashdeals.rs prikuplja, obrađuje i štiti vaše lične podatke u skladu sa ZZPL i GDPR.",
    alternates: { canonical: "https://www.splashdeals.rs/privacy" },
    openGraph: {
      title: "Politika Privatnosti i Zaštita Podataka | Splashdeals",
      description: "Vaša privatnost nam je na prvom mestu. Saznajte kako Splashdeals.rs prikuplja, obrađuje i štiti vaše lične podatke u skladu sa ZZPL i GDPR.",
      images: ["/og-image.png"],
      locale: "sr_RS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Politika Privatnosti i Zaštita Podataka | Splashdeals",
      description: "Vaša privatnost nam je na prvom mestu. Saznajte kako Splashdeals.rs prikuplja, obrađuje i štiti vaše lične podatke u skladu sa ZZPL i GDPR.",
      images: ["/og-image.png"],
    },
  };
}

export default async function PrivacyPage({ params: _params }: PageProps) {
  
  const dict = await getDictionary();
  await connection();

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `https://www.splashdeals.rs/privacy`,
    "name": dict.privacy.title,
    "description": dict.privacy.intro,
    "isPartOf": {
      "@id": "https://www.splashdeals.rs/#website"
    },
  };

  const sections = [
    { title: dict.privacy.section1_title, content: dict.privacy.section1_content },
    { title: dict.privacy.section2_title, content: dict.privacy.section2_content },
    { title: dict.privacy.section3_title, content: dict.privacy.section3_content },
    { title: dict.privacy.section4_title, content: dict.privacy.section4_content },
    { title: dict.privacy.section5_title, content: dict.privacy.section5_content },
    { title: dict.privacy.section6_title, content: dict.privacy.section6_content },
    { title: dict.privacy.section7_title, content: dict.privacy.section7_content },
    { title: dict.privacy.section8_title, content: dict.privacy.section8_content },
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
            <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <Icon name="lock" className="text-[20px] text-teal-400" />
            </div>
            <span className="text-teal-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
              Data Sovereignty
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] text-white">
            {dict.privacy.title}
          </h1>
          
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span>{dict.privacy.updated}</span>
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
          {dict.privacy.intro}
        </div>

        <div className="grid gap-8">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="transition-all duration-300"
            >
              <GlassCard className="p-8 border-white/5 hover:border-teal-500/20 transition-colors group">
                <h2 className="text-xl font-black uppercase italic tracking-tight text-white mb-6 flex items-center gap-3">
                  <Icon name="keyboard_arrow_right" className="text-[20px] text-teal-500 group-hover:translate-x-1 transition-transform" />
                  {section.title}
                </h2>
                <div 
                  className="text-slate-400 leading-relaxed whitespace-pre-line text-sm sm:text-base"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </GlassCard>
            </div>
          ))}
        </div>

        {/* 🛡️ TRUST SECTION */}
        <div
          className="transition-all duration-500"
        >
          <GlassCard className="p-8 border-teal-500/20 bg-teal-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                  <Icon name="visibility" className="text-[20px] text-teal-500" />
                  Transparency First
                </h3>
                <p className="text-slate-400 text-sm">We believe in minimal data collection and maximum security. Your data is your property.</p>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-widest">
                <Icon name="security" className="text-[12px]" />
                Hardened Encryption
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
    </>
  );
}
