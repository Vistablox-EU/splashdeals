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
    title: "Centar za Podršku i Pomoć Korisnicima | Splashdeals",
    description: "Imate pitanje o digitalnim kartama ili plaćanju? Naš tim za korisničku podršku je dostupan 24/7. Pronađite brze odgovore i rešite problem odmah.",
    alternates: { canonical: "https://www.splashdeals.rs/support" },
    openGraph: {
      title: "Centar za Podršku i Pomoć Korisnicima | Splashdeals",
      description: "Imate pitanje o digitalnim kartama ili plaćanju? Naš tim za korisničku podršku je dostupan 24/7. Pronađite brze odgovore i rešite problem odmah.",
      images: ["/og-image.png"],
      locale: "sr_RS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Centar za Podršku i Pomoć Korisnicima | Splashdeals",
      description: "Imate pitanje o digitalnim kartama ili plaćanju? Naš tim za korisničku podršku je dostupan 24/7. Pronađite brze odgovore i rešite problem odmah.",
      images: ["/og-image.png"],
    },
  };
}

export default async function SupportPage({ params: _params }: PageProps) {
  
  const dict = await getDictionary();
  await connection();

  const faqs = [
    { q: dict.support.faq_1_q, a: dict.support.faq_1_a },
    { q: dict.support.faq_2_q, a: dict.support.faq_2_a },
    { q: dict.support.faq_3_q, a: dict.support.faq_3_a },
  ];

  return (
    <div className="min-h-screen pb-32 pt-32 px-6 sm:px-12 max-w-5xl mx-auto">
      <JsonLd 
        id="support-schema"
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ContactPage",
              "@id": "https://www.splashdeals.rs/support#contact",
              "name": "Centar za Podršku | Splashdeals",
              "description": "24/7 korisnička podrška za Splashdeals."
            },
            {
              "@type": "FAQPage",
              "@id": "https://www.splashdeals.rs/support#faq",
              "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.q,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.a
                }
              }))
            }
          ]
        }} 
      />
      {/* 🏙️ HEADER */}
      <header className="mb-20">
        <div 
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Icon name="support" className="text-[20px] text-cyan-400" />
            </div>
            <span className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
              {dict.support.eyebrow || "Centar za Podršku"}
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] text-white">
            {dict.support.title}
          </h1>
          
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <Icon name="schedule" className="text-[12px]" />
            <span>{dict.support.updated}</span>
            <div className="h-1 w-1 rounded-full bg-slate-800" />
            <span>{dict.support.squad || "SplashDeals Tim"}</span>
          </div>
        </div>
      </header>

      {/* 📜 CONTENT GRID */}
      <div className="space-y-12">
        <div
          className="text-lg text-slate-300 leading-relaxed font-medium transition-opacity duration-500"
        >
          {dict.support.intro}
        </div>

        <section className="space-y-8">
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
            <Icon name="help" className="text-[24px] text-cyan-500" />
            {dict.support.faq_title}
          </h2>

          <div className="grid gap-6">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="transition-all duration-300"
              >
                <GlassCard className="p-6 border-white/5 hover:border-cyan-500/20 transition-colors group">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-3">
                    <Icon name="keyboard_arrow_right" className="text-[16px] text-cyan-500 group-hover:translate-x-1 transition-transform" />
                    {faq.q}
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
                    {faq.a}
                  </p>
                </GlassCard>
              </div>
            ))}
          </div>
        </section>

        {/* 📧 CONTACT SECTION */}
        <div
          className="transition-all duration-500"
        >
          <GlassCard className="p-8 border-cyan-500/20 bg-cyan-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                  <Icon name="mail" className="text-[20px] text-cyan-500" />
                  {dict.support.contact_title}
                </h3>
                <p className="text-slate-400 text-sm" dangerouslySetInnerHTML={{ __html: dict.support.contact_content }} />
              </div>
              
              <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-colors cursor-pointer">
                {dict.support.contact_btn || "Kontaktirajte Nas"}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
