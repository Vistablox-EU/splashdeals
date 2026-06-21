import { prisma } from "@/server/lib/prisma";
import { type SuccessDictionary } from "./_components/SuccessClient";
import { SuccessSkeleton } from "./_components/SuccessSkeleton";
import { connection } from "next/server";
import { Suspense } from "react";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import dynamic from "next/dynamic";


const SuccessClient = dynamic(() => import("./_components/SuccessClient").then((mod) => mod.SuccessClient), {
  loading: () => <SuccessSkeleton />
});

export async function generateMetadata({ params: _params }: { params: Promise<Record<string, never>> }): Promise<Metadata> {
  
  const dict = await getDictionary();
  
  return {
    title: (dict.success as SuccessDictionary).metadata.title,
    description: (dict.success as SuccessDictionary).metadata.description,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: (dict.success as SuccessDictionary).metadata.title,
      description: (dict.success as SuccessDictionary).metadata.description,
      images: ["/og-image.png"],
      locale: "sr_RS",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: (dict.success as SuccessDictionary).metadata.title,
      description: (dict.success as SuccessDictionary).metadata.description,
      images: ["/og-image.png"],
    },
  };
}

/**
 * 🌊 High-Density Success Page (Next.js 16 PPR)
 * Enforces atomic fulfillment verification before rendering.
 */
export default async function SuccessPage(props: {
  params: Promise<Record<string, never>>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const session_id = searchParams.session_id as string | undefined;
  const dict = await getDictionary();
  const successDict = dict.success as SuccessDictionary;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl overflow-hidden min-h-screen">
      {!session_id ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 pt-20">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </div>
          <div className="space-y-2">
              <h1 className="text-3xl font-black text-foreground italic tracking-tighter uppercase italic">{successDict.access_denied.title}</h1>
              <p className="text-muted-foreground max-w-xs mx-auto">{successDict.access_denied.description}</p>
          </div>
        </div>
      ) : (
        <Suspense fallback={<SuccessSkeleton />}>
          <SuccessContent session_id={session_id} dict={successDict} />
        </Suspense>
      )}
    </div>
  );
}

async function SuccessContent({ session_id, dict }: { session_id: string; dict: SuccessDictionary }) {
  // Enforce Next.js 16 Dynamic Connection
  await connection();

  const transaction = await prisma.transaction.findFirst({
    where: { stripeSession: session_id },
    include: {
      issuedTickets: {
        include: {
          ticketPrice: {
            include: {
              ticketType: {
                include: {
                  category: {
                    include: {
                      facility: true,
                    }
                  }
                }
              }
            }
          },
        },
      },
    },
  });

  // 🧪 Optimization: Pre-serialize Decimal or Date types if Prisma uses them 
  // (Standard practice for Client Components in Splashdeals)
  const serialized = transaction ? JSON.parse(JSON.stringify(transaction)) : null;

  return (
    <SuccessClient 
      sessionId={session_id} 
      initialTransaction={serialized} 
      dict={dict}
    />
  );
}
