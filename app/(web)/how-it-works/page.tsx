import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { connection } from "next/server";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { JsonLd } from "@/components/SEO/JsonLd";

interface PageProps {
  params: Promise<Record<string, never>>;
}

export async function generateMetadata({ params: _params }: PageProps): Promise<Metadata> {
  return {
    title: "Kako kupiti digitalne karte za akva parkove",
    description: "Saznajte kako da u 3 jednostavna koraka kupite online karte za akva parkove u Srbiji, preskočite čekanje na ulazu i uživate u letu bez stresa.",
    alternates: { canonical: "https://www.splashdeals.rs/how-it-works" },
    openGraph: {
      title: "Kako kupiti digitalne karte za akva parkove",
      description: "Saznajte kako da u 3 jednostavna koraka kupite online karte za akva parkove u Srbiji, preskočite čekanje na ulazu i uživate u letu bez stresa.",
      images: ["/og-image.png"],
      locale: "sr_RS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Kako kupiti digitalne karte za akva parkove",
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
      color: "text-primary",
      bg: "bg-primary/10"
    },
    { 
      title: dict.how_it_works_page.step2_title, 
      content: dict.how_it_works_page.step2_content,
      icon: "credit_card",
      color: "text-primary",
      bg: "bg-primary/10"
    },
    { 
      title: dict.how_it_works_page.step3_title, 
      content: dict.how_it_works_page.step3_content,
      icon: "confirmation_number",
      color: "text-primary",
      bg: "bg-primary/10"
    },
  ];

  return (
    <div className="min-h-screen pb-16 sm:pb-32 pt-24 sm:pt-32 px-6 sm:px-12 max-w-5xl mx-auto">
      <JsonLd 
        id="how-it-works-schema"
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "HowTo",
              "name": "Kako kupiti digitalne karte za akva parkove",
              "description": "Saznajte kako da u 3 jednostavna koraka kupite online karte za akva parkove u Srbiji.",
              "step": steps.map((step, index) => ({
                "@type": "HowToStep",
                "position": index + 1,
                "name": step.title,
                "text": step.content,
              }))
            },
            {
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Kako dobijam karte nakon uplate?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Odmah nakon uspešne uplate, digitalne ulaznice stižu direktno na vašu email adresu i postaju dostupne unutar vašeg korisničkog naloga. Možete ih sačuvati u Apple ili Google Wallet za lak pristup."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Da li mogu da otkažem ili promenim karte?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Politika otkaza zavisi od objekta i vrste ulaznice. Detaljne informacije o uslovima otkaza i zamene su prikazane pre nego što potvrdite kupovinu na stranici svakog objekta."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Kako koristim QR kod na ulazu?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Kada stignete na ulaz, jednostavno otvorite digitalnu kartu na svom telefonu i pokažite QR kod osoblju. Oni će ga skenirati i možete momentalno ući — bez štampanja i bez čekanja u redu."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Koje metode plaćanja prihvatate?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Prihvatamo sve glavne platne kartice (Visa, Mastercard, Maestro) putem bezbednog plaćanja. Transakcije su zaštićene SSL/TLS enkripcijom. Nije potrebna registracija za kupovinu."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Da li deca dobijaju popust ili besplatan ulaz?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Cene za decu variraju od objekta do objekta. Prilikom izbora ulaznica, prikazane su sve dostupne kategorije uključujući dečije, porodične i grupne karte sa odgovarajućim cenama."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Mogu li kupiti karte za nekog drugog?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Da, možete kupiti više karata u jednoj transakciji i proslediti ih drugim osobama. Svaka karta ima jedinstveni QR kod koji se može koristiti nezavisno."
                  }
                }
              ]
            }
          ]
        }} 
      />
      {/* 🏙️ HEADER */}
      <header className="mb-12 sm:mb-20 text-center sm:text-left">
        <div 
          className="space-y-6"
        >
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Icon name="check_circle" className="text-[20px] text-primary" />
            </div>
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">
              The Splash Protocol
            </span>
          </div>

          <h1 className="text-5xl sm:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] text-foreground">
            {dict.how_it_works_page.title}
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl font-medium">
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
          className="inline-flex items-center gap-4 px-10 py-5 rounded-2xl bg-primary text-primary-foreground font-black uppercase italic tracking-tighter text-xl hover:bg-primary/90 hover:scale-105 transition-all active:scale-95 shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
        >
          {dict.how_it_works_page.cta}
          <Icon name="arrow_forward" className="text-[24px]" />
        </Link>
      </div>
    </div>
  );
}
