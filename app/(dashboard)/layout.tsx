import "@/app/globals.css"
import * as React from "react"
import { Fira_Sans } from "next/font/google"
import { cn } from "@/lib/utils"

const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
})

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen antialiased bg-background text-foreground selection:bg-cyan-500/20 font-sans">
      {children}
    </div>
  )
}
