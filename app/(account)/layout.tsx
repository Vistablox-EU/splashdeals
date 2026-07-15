import * as React from "react";
import { getDictionary } from "@/lib/dictionaries";
import { prisma } from "@/app/(server)/lib/prisma";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { GAScript } from "@/components/analytics/GoogleAnalytics";
import { WebVitals } from "@/app/(web)/_components/WebVitals";

/**
 * Account route group layout — same platform chrome as `(web)`.
 * Portal subnav lives in `(portal)/layout.tsx` (not on /prijava).
 */
export default async function AccountRootLayout({ children }: { children: React.ReactNode }) {
  const dict = await getDictionary();

  const facilities = await prisma.facility.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, name: true, category: true },
  });
  const facilityMap = Object.fromEntries(
    facilities.map((f) => [f.slug, { name: f.name, category: f.category }]),
  );

  return (
    <>
      <WebVitals />
      <GAScript />
      <PlatformShell dict={dict} facilityMap={facilityMap} showStructuredData={false}>
        {children}
      </PlatformShell>
    </>
  );
}
