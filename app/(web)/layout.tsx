import * as React from "react";
import { getDictionary } from "@/lib/dictionaries";
import { prisma } from "@/app/(server)/lib/prisma";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { GAScript } from "@/components/analytics/GoogleAnalytics";
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
      <GAScript />
      <WebLayoutContent modal={modal}>{children}</WebLayoutContent>
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

  const facilities = await prisma.facility.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, name: true, category: true },
  });
  const facilityMap = Object.fromEntries(
    facilities.map((f) => [f.slug, { name: f.name, category: f.category }]),
  );

  return (
    <PlatformShell dict={dict} facilityMap={facilityMap}>
      {children}
      {modal ? <React.Suspense fallback={null}>{modal}</React.Suspense> : null}
    </PlatformShell>
  );
}
