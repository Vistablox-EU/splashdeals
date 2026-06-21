"use client"
import { Icon } from "@/components/ui/Icon";

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { getClientDictionary } from "@/lib/client-dictionaries"


/**
 * 🛡️ Aquastream Global Web Error Boundary
 * Catch-all for the entire (web) route group.
 */
export default function GlobalWebError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  
  const [dict, setDict] = useState<any | null>(null)

  useEffect(() => {
    console.error("Global Web Error:", error)
    let mounted = true
    getClientDictionary().then((d) => {
      if (mounted) setTimeout(() => setDict(d), 0)
    })
    return () => { mounted = false }
  }, [error])

  // Fallback while dictionary loads (matching the style)
  if (!dict) {
    return (
      <div className="min-h-screen bg-background" />
    )
  }

  return (
    <div className="relative min-h-screen bg-background text-white flex items-center justify-center p-6 md:p-12 overflow-hidden selection:bg-primary/20">
      
      {/* 🌊 Atmospheric Background Particles */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
         <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="waves" className="w-[80vw] h-[80vw] text-slate-900 stroke-[0.1]" />
         </div>
      </div>

      <Card className="max-w-xl w-full p-8 md:p-16 border-cyan-500/10 bg-muted/50 relative z-10 text-center space-y-8">
        <div className="relative inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 border border-cyan-500/20 text-primary">
          <Icon name="error" className="text-[48px] stroke-[1.5]" />
        </div>

        <div className="space-y-4">
           <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-slate-100">
             {dict.errors.title} <br />
             <span className="text-primary">{dict.errors.highlight}</span>
           </h1>
           <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto">
             {dict.errors.subtitle}
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
           <button 
             onClick={reset}
             className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-border font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all group"
           >
             <Icon name="refresh" className="text-[16px]" />
             {dict.errors.try_again}
           </button>
           <Link 
             href="/"
             className="px-8 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-background font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-2xl shadow-primary/10 transition-all"
           >
             <Icon name="home" className="text-[16px]" />
             {dict.errors.back_home}
           </Link>
        </div>
      </Card>

    </div>
  )
}
