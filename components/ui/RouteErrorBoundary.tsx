"use client"
import { Icon } from "@/components/ui/Icon";

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { getClientDictionary } from "@/lib/client-dictionaries"


interface RouteErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
  subtitleKey?: string
  isModal?: boolean
}

export function RouteErrorBoundary({
  error,
  reset,
  subtitleKey,
  isModal = false,
}: RouteErrorBoundaryProps) {
  const [dict, setDict] = useState<any | null>(null)

  useEffect(() => {
    console.error("Route Error Boundary Captured:", error)
    getClientDictionary().then(setDict)
  }, [error])

  // Simple placeholder matching background color while dictionary loads
  if (!dict) {
    return (
      <div 
        className={
          isModal 
            ? "flex items-center justify-center p-8 bg-[#020617] rounded-3xl" 
            : "min-h-screen bg-[#020617]"
        } 
      />
    )
  }

  const customSubtitle = subtitleKey ? dict.errors[subtitleKey] : null
  const subtitle = customSubtitle || dict.errors.subtitle

  if (isModal) {
    return (
      <div className="flex items-center justify-center p-6 bg-navy-deep/80 backdrop-blur-md rounded-[2.5rem] border border-white/5 selection:bg-cyan-500/20 max-w-lg mx-auto">
        <div 
          className="text-center space-y-6 p-6 w-full"
        >
          <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto">
            <Icon name="error" className="text-[32px] stroke-[1.5]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-slate-100">
              {dict.errors.title}{" "}
              <span className="text-cyan-400">{dict.errors.highlight}</span>
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
              {subtitle}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={reset}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/5 font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 transition-all text-white"
            >
              <Icon name="refresh" className="text-[14px]" />
              {dict.errors.try_again}
            </button>
            <Link 
              href="/"
              className="flex-1 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#020617] font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 shadow-xl shadow-cyan-500/10 transition-all"
            >
              <Icon name="home" className="text-[14px]" />
              {dict.errors.back_home}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[70vh] bg-[#020617] text-white flex items-center justify-center p-6 md:p-12 overflow-hidden selection:bg-cyan-500/20 w-full">
      {/* 🌊 Atmospheric Background Particles */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />
         <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="waves" className="w-[60vw] h-[60vw] text-slate-900 stroke-[0.1]" />
         </div>
      </div>

      <div
        className="max-w-xl w-full relative z-10"
      >
        <Card className="p-8 md:p-16 border-cyan-500/10 bg-white/5 text-center space-y-8">
          <div className="relative inline-flex items-center justify-center h-20 w-20 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto">
            <Icon name="error" className="text-[40px] stroke-[1.5]" />
          </div>

          <div className="space-y-4">
             <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-100">
               {dict.errors.title} <br />
               <span className="text-cyan-400">{dict.errors.highlight}</span>
             </h1>
             <p className="text-slate-400 text-base leading-relaxed max-w-sm mx-auto">
               {subtitle}
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
             <button 
               onClick={reset}
               className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/5 font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all text-white"
             >
               <Icon name="refresh" className="text-[16px]" />
               {dict.errors.try_again}
             </button>
             <Link 
               href="/"
               className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-[#020617] font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/10 transition-all"
             >
               <Icon name="home" className="text-[16px]" />
               {dict.errors.back_home}
             </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
