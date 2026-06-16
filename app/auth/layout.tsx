import "@/app/globals.css";
import * as React from "react";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
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

/**
 * 🔒 Auth Layout
 * Standalone root layout for login, forgot-password, and reset-password.
 * Desktop-first, glassmorphism, aqua/teal palette.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr" className={cn("dark font-sans", geist.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased bg-[#020617] text-slate-100 selection:bg-cyan-500/20">
        <div className="min-h-screen">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grid.svg')] bg-center opacity-[0.02]" />
      </div>

      <main className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Header/Logo area */}
          <div className="mb-12 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-2xl shadow-cyan-500/20">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#020617] text-2xl font-black text-cyan-400">
                    S
                </div>
            </div>
            <h1 className="mt-6 text-3xl font-black uppercase tracking-tighter italic">
              Splashdeals <span className="text-slate-500">Admin</span>
            </h1>
          </div>

          {children}

          <footer className="mt-12 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">
              Splashdeals.rs &bull; Partner Security Gateway
            </p>
          </footer>
        </div>
      </main>
        </div>
      </body>
    </html>
  );
}
