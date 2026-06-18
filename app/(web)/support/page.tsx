import { Icon } from "@/components/ui/Icon";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/SEO/JsonLd";

interface PageProps {
  params: Promise<Record<string, never>>;
}

export async function generateMetadata({ params: _params }: PageProps): Promise<Metadata> {
  return {
    title: "Centar za Podršku i Pomoć Korisnicima",
    description: "Imate pitanje o digitalnim kartama ili plaćanju? Naš tim za korisničku podršku je dostupan 24/7. Pronađite brze odgovore i rešite problem odmah.",
    alternates: { canonical: "https://www.splashdeals.rs/support" },
    openGraph: {
      title: "Centar za Podršku i Pomoć Korisnicima",
      description: "Imate pitanje o digitalnim kartama ili plaćanju? Naš tim za korisničku podršku je dostupan 24/7. Pronađite brze odgovore i rešite problem odmah.",
      images: ["/og-image.png"],
      locale: "sr_RS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Centar za Podršku i Pomoć Korisnicima",
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
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Icon name="support" className="text-[20px] text-primary" />
            </div>
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
              {dict.support.eyebrow || "Centar za Podršku"}
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] text-foreground">
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
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-3">
            <Icon name="help" className="text-[24px] text-primary" />
            {dict.support.faq_title}
          </h2>

          <div className="grid gap-6">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="transition-all duration-300"
              >
                <Card className="p-6 border-border hover:border-primary/20 transition-colors group">
                  <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-3">
                    <Icon name="keyboard_arrow_right" className="text-[16px] text-primary group-hover:translate-x-1 transition-transform" />
                    {faq.q}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    {faq.a}
                  </p>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* 📧 CONTACT SECTION */}
        <div
          className="transition-all duration-500"
        >
          <Card className="p-8 border-primary/20 bg-primary/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
                  <Icon name="mail" className="text-[20px] text-primary" />
                  {dict.support.contact_title}
                </h3>
                <p className="text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: dict.support.contact_content }} />
              </div>
              
              <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-colors cursor-pointer">
                {dict.support.contact_btn || "Kontaktirajte Nas"}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
