"use client";
import { Icon } from "@/components/ui/Icon";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getClientDictionary } from "@/lib/client-dictionaries";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/SEO/JsonLd";

export function NotFoundClient() {
   
  const [dict, setDict] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  if (!dict) {
    return (
      <section className="flex min-h-[80vh] flex-col items-center justify-center">
        <div className="bg-muted h-20 w-20 animate-pulse rounded-full" />
      </section>
    );
  }

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${dict.not_found.title} ${dict.not_found.highlight}`,
    description: dict.not_found.desc,
    url: `https://www.splashdeals.rs/404`,
  };

  return (
    <>
      <JsonLd id="not-found-schema" data={webpageSchema} />

      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 py-32">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none">
          <span className="text-foreground/5 text-[15rem] leading-none font-black tracking-tighter sm:text-[30rem]">
            404
          </span>
        </div>

        <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
          <div className="bg-primary/10 shadow-primary/5 ring-border mb-10 flex h-24 w-24 items-center justify-center rounded-3xl shadow-2xl ring-1 backdrop-blur-sm">
            <Icon name="location_off" className="text-primary text-[40px]" />
          </div>

          <h1 className="from-foreground to-muted-foreground mb-8 bg-gradient-to-br bg-clip-text text-5xl font-black tracking-tighter text-transparent uppercase italic sm:text-7xl">
            {dict.not_found.title} <span className="text-primary">{dict.not_found.highlight}</span>?
          </h1>

          <p className="text-muted-foreground mb-4 max-w-lg text-xl leading-relaxed font-medium">
            {dict.not_found.desc}
          </p>

          <p className="text-muted-foreground mb-14 text-sm">{dict.not_found.sublabel}</p>

          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[220px] rounded-full px-10 py-5"
            >
              <Link href="/" className="flex items-center justify-center gap-2">
                <Icon name="arrow_back" className="text-[16px]" />
                {dict.not_found.back_home}
              </Link>
            </Button>

            <Link
              href={`/`}
              className="group text-muted-foreground hover:text-foreground flex items-center gap-2 px-8 py-4 text-xs font-black tracking-[.25em] uppercase transition-colors"
            >
              <Icon name="waves" className="text-primary text-[16px] group-hover:animate-pulse" />
              {dict.not_found.browse_parks}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
