import { prisma } from "@/app/(server)/lib/prisma";
import { type SuccessDictionary } from "./_components/SuccessClient";
import { SuccessSkeleton } from "./_components/SuccessSkeleton";
import { connection } from "next/server";
import { Suspense } from "react";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import dynamic from "next/dynamic";
import { auth } from "@/app/(server)/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { toCheckoutStatusDto } from "@/app/(server)/lib/checkout-status-dto";

const SuccessClient = dynamic(
  () => import("./_components/SuccessClient").then((mod) => mod.SuccessClient),
  {
    loading: () => <SuccessSkeleton />,
  },
);

export async function generateMetadata({
  params: _params,
}: {
  params: Promise<Record<string, never>>;
}): Promise<Metadata> {
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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/prijava");
  }
  const dict = await getDictionary();
  const successDict = dict.success as SuccessDictionary;

  return (
    <div className="container mx-auto min-h-screen max-w-6xl overflow-hidden px-4 py-8 sm:py-12">
      {!session_id ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-6 pt-8 text-center sm:min-h-[60vh] sm:pt-20">
          <div className="border-destructive/20 bg-destructive/10 text-destructive flex h-16 w-16 items-center justify-center rounded-full border shadow-[0_0_20px_hsl(var(--destructive)/0.2)] sm:h-20 sm:w-20">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-foreground text-2xl font-black tracking-tighter uppercase italic sm:text-3xl">
              {successDict.access_denied.title}
            </h1>
            <p className="text-muted-foreground mx-auto max-w-xs text-sm sm:text-base">
              {successDict.access_denied.description}
            </p>
          </div>
        </div>
      ) : (
        <Suspense fallback={<SuccessSkeleton />}>
          <SuccessContent session_id={session_id} userId={session.user.id} dict={successDict} />
        </Suspense>
      )}
    </div>
  );
}

async function SuccessContent({
  session_id,
  userId,
  dict,
}: {
  session_id: string;
  userId: string;
  dict: SuccessDictionary;
}) {
  // Enforce Next.js 16 Dynamic Connection
  await connection();

  const transaction = await prisma.transaction.findFirst({
    where: { stripeSession: session_id, userId },
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
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // 🧪 Optimization: Pre-serialize Decimal or Date types if Prisma uses them
  // (Standard practice for Client Components in Splashdeals)
  const serialized = transaction
    ? JSON.parse(JSON.stringify(toCheckoutStatusDto(transaction)))
    : null;

  return <SuccessClient sessionId={session_id} initialTransaction={serialized} dict={dict} />;
}
