import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import * as React from "react";
import "./globals.css";
import { headers } from "next/headers";

export const viewport: Viewport = {
  themeColor: "#06b6d4",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  display: "swap",
});

export async function generateMetadata({ params }: { params: Promise<Record<string, never>> }): Promise<Metadata> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  
  return {
    metadataBase: new URL("https://www.splashdeals.rs"),
    title: {
      template: "%s | Splashdeals",
      default: "Splashdeals | Najbolji Akva Parkovi i Bazeni u Srbiji",
    },
    description: "Preskočite redove i uskočite u zabavu. Kupite digitalne karte za Petroland i druge najbolje akva parkove u Srbiji instant.",
    alternates: {
      canonical: `https://www.splashdeals.rs${pathname}`,
      languages: {
        "sr-RS": `https://www.splashdeals.rs${pathname}`,
        "sr": `https://www.splashdeals.rs${pathname}`,
        "x-default": `https://www.splashdeals.rs${pathname}`,
      }
    },
    openGraph: {
      images: ["/og-image.png"],
      type: "website",
      siteName: "Splashdeals",
      locale: "sr_RS",
    },
    twitter: {
      card: "summary_large_image",
      images: ["/og-image.png"]
    },
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon.ico' },
      ],
      apple: [
        { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      other: [
        { rel: 'mask-icon', url: '/logo.png', color: '#06b6d4' },
      ],
    },
    manifest: '/site.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Splashdeals',
    },
  };
}
/**
 * 🌊 Web Shell
 * Updated for Advanced Parallel Routing (Modals)
 */
import { Header } from "@/components/layout/Header";
import { GlobalAmbient } from "@/components/ui/GlobalAmbient";
import { getDictionary } from "@/lib/dictionaries";
import { getActiveCities } from "@/server/lib/data/discovery";
import dynamic from "next/dynamic";

const CartDrawer = dynamic(() => import("@/components/cart/CartDrawer").then((mod) => mod.CartDrawer));

const Footer = dynamic(() => import("@/components/layout/Footer").then((mod) => mod.Footer), {
  ssr: true,
});

import { WebVitals } from "./_components/WebVitals";

export default async function WebLayout({
  children,
  modal,
  params,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode; 
  params: Promise<Record<string, never>>;
}) {
  
  const dict = await getDictionary();
  const cities = await getActiveCities();
  
  return (
    <html lang="sr" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet" />
        <link rel="preconnect" href="https://grainy-gradients.vercel.app" />
        <link rel="preconnect" href="https://f7t7eeiv4kcyjvws.public.blob.vercel-storage.com" crossOrigin="anonymous" />
      </head>
      <body className={`${geistSans.variable} antialiased selection:bg-cyan-500/20 bg-[#020617]`}>
        <WebVitals />
          <div className="min-h-screen flex flex-col overflow-x-hidden font-sans">
            <GlobalAmbient />
            <Header dict={dict} cities={cities} />
            
            <main className="flex-grow pt-20">
              <React.Suspense fallback={<div className="flex-1 flex items-center justify-center p-20 animate-pulse bg-slate-900" />}>
                {children}
              </React.Suspense>
            </main>
            
            <React.Suspense fallback={null}>
              {modal}
            </React.Suspense>

            <Footer />
            <CartDrawer />
          </div>
      </body>
    </html>
  );
}


