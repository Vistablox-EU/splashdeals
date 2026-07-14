import * as React from "react";
import { Header } from "@/components/layout/Header";
import { NavigationStructuredData } from "@/components/layout/_header/NavigationStructuredData";
import { BreadcrumbBar } from "@/components/layout/BreadcrumbBar";
import { GlobalAmbient } from "@/components/ui/GlobalAmbient";
import { getDictionary } from "@/lib/dictionaries";
import { getActiveCities } from "@/app/(server)/lib/data/discovery";
import { prisma } from "@/app/(server)/lib/prisma";
import dynamic from "next/dynamic";
import { CartLoader } from "@/components/cart/CartLoader";
import { GAScript } from "@/components/analytics/GoogleAnalytics";

const Footer = dynamic(() => import("@/components/layout/Footer").then((mod) => mod.Footer), {
  ssr: true,
});

import { WebVitals } from "./_components/WebVitals";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function WebLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  return (
    <>
      <WebVitals />
      <GAScript />
      <WebLayoutContent>
        {children}
        {modal}
      </WebLayoutContent>
    </>
  );
}

async function WebLayoutContent({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  const dict = await getDictionary();
  const cities = await getActiveCities();

  // Pre-fetch facility map for client-side breadcrumb resolution
  const facilities = await prisma.facility.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, name: true, category: true },
  });
  const facilityMap = Object.fromEntries(
    facilities.map((f) => [f.slug, { name: f.name, category: f.category }]),
  );

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden font-sans">
      {/* ♿ Skip to content — first focusable element for keyboard users */}
      <a
        href="#main-content"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[9999] focus:rounded-xl focus:px-4 focus:py-3 focus:text-xs focus:font-black focus:tracking-widest focus:uppercase focus:shadow-lg focus:outline-none"
      >
        Preskoči na sadržaj
      </a>
      <GlobalAmbient />
      <NavigationStructuredData />
      <Header dict={dict} cities={cities} />

      {/* 🧭 Breadcrumb bar — always visible just below the top nav header */}
      <BreadcrumbBar facilityMap={facilityMap} />

      <main id="main-content" className="flex-grow pt-16 pb-16 sm:pb-0">
        <React.Suspense
          fallback={
            <div className="bg-muted flex flex-1 animate-pulse items-center justify-center p-20" />
          }
        >
          {children}
        </React.Suspense>
      </main>

      <React.Suspense fallback={null}>{modal}</React.Suspense>

      <Footer />
      <CartLoader />
      <BottomNav />
    </div>
  );
}
