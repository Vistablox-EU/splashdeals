import * as React from "react";
import { Header } from "@/components/layout/Header";
import { NavigationStructuredData } from "@/components/layout/_header/NavigationStructuredData";
import { BreadcrumbBar } from "@/components/layout/BreadcrumbBar";
import { GlobalAmbient } from "@/components/ui/GlobalAmbient";
import { getDictionary } from "@/lib/dictionaries";
import { getActiveCities } from "@/server/lib/data/discovery";
import dynamic from "next/dynamic";
import { CartLoader } from "@/components/cart/CartLoader";

const Footer = dynamic(
  () => import("@/components/layout/Footer").then((mod) => mod.Footer),
  { ssr: true }
);

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

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden font-sans">
      <GlobalAmbient />
      <NavigationStructuredData />
      <Header dict={dict} cities={cities} />

      {/* 🧭 Breadcrumb bar — always visible just below the top nav header */}
      <BreadcrumbBar />

      <main className="flex-grow pt-16 pb-16 sm:pb-0">
        <React.Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center p-20 animate-pulse bg-muted" />
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
