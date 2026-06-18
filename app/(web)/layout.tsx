import type { Metadata } from "next";
import * as React from "react";
import { Header } from "@/components/layout/Header";
import { BreadcrumbBar } from "@/components/layout/BreadcrumbBar";
import { GlobalAmbient } from "@/components/ui/GlobalAmbient";
import { getDictionary } from "@/lib/dictionaries";
import { getActiveCities } from "@/server/lib/data/discovery";
import dynamic from "next/dynamic";

const CartDrawer = dynamic(() =>
  import("@/components/cart/CartDrawer").then((mod) => mod.CartDrawer)
);

const Footer = dynamic(
  () => import("@/components/layout/Footer").then((mod) => mod.Footer),
  { ssr: true }
);

import { WebVitals } from "./_components/WebVitals";

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
      <React.Suspense fallback={<div className="min-h-screen bg-background" />}>
        <WebLayoutContent>
          {children}
          {modal}
        </WebLayoutContent>
      </React.Suspense>
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
      <Header dict={dict} cities={cities} />

      {/* 🧭 Breadcrumb bar — always visible just below the top nav header */}
      <BreadcrumbBar />

      <main className="flex-grow pt-[6.5rem]">
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
      <CartDrawer />
    </div>
  );
}
