"use client";
import { Icon } from "@/components/ui/Icon";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getClientDictionary } from "@/lib/client-dictionaries";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/SEO/JsonLd";

export function NotFoundClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dict, setDict] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  if (!dict) {
    return (
      <section className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-slate-800 animate-pulse" />
      </section>
    );
  }

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${dict.not_found.title} ${dict.not_found.highlight}`,
    "description": dict.not_found.desc,
    "url": `https://www.splashdeals.rs/404`
  };

  return (
    <>
      <JsonLd id="not-found-schema" data={webpageSchema} />
      
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 py-32 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[15rem] sm:text-[30rem] font-black text-white leading-none tracking-tighter opacity-[0.03]">
            404
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
          <div
            className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-10 ring-1 ring-white/10 shadow-2xl shadow-primary/5 backdrop-blur-sm"
          >
            <Icon name="location_off" className="text-[40px] text-primary" />
          </div>

          <h1
            className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter mb-8 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent"
          >
            {dict.not_found.title} <span className="text-primary">{dict.not_found.highlight}</span>?
          </h1>
          
          <p
            className="text-xl text-slate-400 font-medium leading-relaxed mb-4 max-w-lg"
          >
            {dict.not_found.desc}
          </p>
          
          <p
            className="text-sm text-slate-500 mb-14"
          >
            {dict.not_found.sublabel}
          </p>

          <div
            className="flex flex-col sm:flex-row gap-6 items-center"
          >
            <Button className="px-10 py-5 min-w-[220px] bg-primary text-black hover:bg-primary/90 rounded-full">
              <Link href="/" className="flex items-center justify-center gap-2 w-full h-full">
                <Icon name="arrow_back" className="text-[16px]" />
                {dict.not_found.back_home}
              </Link>
            </Button>
            
            <Link 
              href={`/`}
              className="text-xs font-black uppercase tracking-[.25em] text-slate-500 hover:text-white transition-colors py-4 px-8 flex items-center gap-2 group"
            >
              <Icon name="waves" className="text-[16px] group-hover:animate-pulse text-primary" />
              {dict.not_found.browse_parks}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
