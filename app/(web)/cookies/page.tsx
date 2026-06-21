import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/card";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { connection } from "next/server";
import { JsonLd } from "@/components/SEO/JsonLd";

interface PageProps {
  params: Promise<Record<string, never>>;
}

export async function generateMetadata({}: PageProps): Promise<Metadata> {
  return {
    title: "Politika Kolačića i Upravljanje Podacima",
    description: "Saznajte kako Splashdeals.rs koristi kolačiće za optimalan rad korpe i personalizaciju pretrage, i kako možete sami upravljati njima u pretraživaču.",
    alternates: { canonical: "https://www.splashdeals.rs/cookies" },
    openGraph: {
      title: "Politika Kolačića i Upravljanje Podacima",
      description: "Saznajte kako Splashdeals.rs koristi kolačiće za optimalan rad korpe i personalizaciju pretrage, i kako možete sami upravljati njima u pretraživaču.",
      images: ["/og-image.png"],
      locale: "sr_RS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Politika Kolačića i Upravljanje Podacima",
      description: "Saznajte kako Splashdeals.rs koristi kolačiće za optimalan rad korpe i personalizaciju pretrage, i kako možete sami upravljati njima u pretraživaču.",
      images: ["/og-image.png"],
    },
  };
}

export default async function CookiesPage({}: PageProps) {
  
  const dict = await getDictionary();
  await connection();

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `https://www.splashdeals.rs/cookies`,
    "name": dict.cookies.title,
    "description": dict.cookies.intro,
    "isPartOf": {
      "@id": "https://www.splashdeals.rs/#website"
    },
  };

  const sections = [
    { title: dict.cookies.section1_title, content: dict.cookies.section1_content },
    { title: dict.cookies.section2_title, content: dict.cookies.section2_content },
    { title: dict.cookies.section3_title, content: dict.cookies.section3_content },
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
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Icon name="cookie" className="text-[20px] text-primary" />
            </div>
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
              Privacy Control
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] text-foreground">
            {dict.cookies.title}
          </h1>
          
          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span>{dict.cookies.updated}</span>
            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <span>SplashDeals.rs</span>
          </div>
        </div>
      </header>

      {/* 📜 CONTENT GRID */}
      <div className="space-y-12">
        <div
          className="text-lg text-slate-300 leading-relaxed font-medium transition-opacity duration-500"
        >
          {dict.cookies.intro}
        </div>

        <div className="grid gap-8">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="transition-all duration-300"
            >
              <Card className="p-8 border-border hover:border-primary/20 transition-colors group">
                <h2 className="text-xl font-black uppercase italic tracking-tight text-foreground mb-6 flex items-center gap-3">
                  <Icon name="keyboard_arrow_right" className="text-[20px] text-primary group-hover:translate-x-1 transition-transform" />
                  {section.title}
                </h2>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
                  {section.content}
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* 📧 CONTACT SECTION */}
        <div
          className="transition-all duration-500"
        >
          <Card className="p-8 border-primary/20 bg-primary/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic tracking-tight text-foreground flex items-center gap-2">
                  <Icon name="mail" className="text-[20px] text-primary" />
                  {dict.cookies.contact_title}
                </h3>
                <p className="text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: dict.cookies.contact_content }} />
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                <Icon name="security" className="text-[12px]" />
                Data Protection Officer
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
