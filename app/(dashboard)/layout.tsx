import "@/app/globals.css";
import * as React from "react";
import { Fira_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr" className={cn("dark font-sans", firaSans.variable)}>
      <body className="min-h-screen antialiased bg-[#020617] text-slate-100 selection:bg-cyan-500/20 font-sans">
        {children}
      </body>
    </html>
  );
}
