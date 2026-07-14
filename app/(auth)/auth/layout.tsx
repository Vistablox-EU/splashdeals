import "./globals.css";
import { type ReactNode, Suspense } from "react";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { auth } from "@/app/(server)/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Splashdeals - Partner Security Gateway",
  description: "Secure login portal for Splashdeals partners.",
  robots: {
    index: false,
    follow: false,
  },
};

/** Suspense-wrapped session guard — marks this subtree as dynamic */
async function AuthGuard({ children }: { children: ReactNode }) {
  await connection();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/admin");
  }

  return <>{children}</>;
}

export default async function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sr" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen antialiased">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-cyan-500/5 blur-[120px]" />
          <div className="absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-[url('/grid.svg')] bg-center opacity-[0.02]" />
        </div>

        <main className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-md">
            <div className="mb-12 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-2xl shadow-cyan-500/20">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#020617] text-2xl font-black text-cyan-400">
                  S
                </div>
              </div>
              <h1 className="mt-6 text-3xl font-black tracking-tighter uppercase italic">
                Splashdeals <span className="text-slate-500">Admin</span>
              </h1>
            </div>

            <Suspense fallback={null}>
              <AuthGuard>{children}</AuthGuard>
            </Suspense>

            <footer className="mt-12 text-center">
              <p className="text-[10px] font-black tracking-[0.3em] text-slate-700 uppercase">
                Splashdeals.rs &bull; Partner Security Gateway
              </p>
            </footer>
          </div>
        </main>
      </body>
    </html>
  );
}
