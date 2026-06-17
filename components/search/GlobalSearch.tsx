"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getClientDictionary } from "@/lib/client-dictionaries"

/**
 * 🔍 Global Search Command Palette
 * High-performance search interface designed for Parallel/Intercepting routing.
 */
export function GlobalSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams ? (searchParams.get("q") || "") : ""

  const [prevQ, setPrevQ] = React.useState(q)
  const [query, setQuery] = React.useState(q)
  const [results, setResults] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [dict, setDict] = React.useState<any>(null)

  React.useEffect(() => {
    getClientDictionary().then(setDict)
  }, [])

  // Synchronize state when URL parameters change (e.g. clicking links while on /search page)
  if (q !== prevQ) {
    setPrevQ(q)
    setQuery(q)
  }

  // Adjust results during render (Prevents cascading effect renders)
  if (query.length < 2 && results.length > 0) {
    setResults([])
  }

  // Close search and go back
  const handleClose = () => router.back()

  // Simulate search logic (will connect to API later)
  React.useEffect(() => {
    if (query.length < 2) return

    const delay = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search?q=${query}`)
        const data = await res.json()
        setResults(data)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(delay)
  }, [query])

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[15vh] px-4">
      {/* 🌑 Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
      />

      {/* ⌨️ Search Palette */}
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl shadow-cyan-500/10 overflow-hidden"
      >
        <div className="relative p-6 border-b border-white/5">
          <Icon name="search" className="absolute left-10 top-1/2 -translate-y-1/2 text-[20px] text-cyan-500" />
          <label htmlFor="global-search" className="sr-only">
            {dict?.search?.sr_label || "Pretražite akva parkove, gradove ili akcije"}
          </label>
          <Input
            id="global-search"
            autoFocus
            placeholder={dict?.search?.placeholder || "Pretražite akva parkove, gradove ili akcije..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/5 border-none h-14 pl-14 pr-12 text-lg font-bold placeholder:text-slate-500 focus-visible:ring-0"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <Icon name="close" className="text-[20px]" />
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4" aria-busy="true">
                <Icon name="progress_activity" className="text-[32px] text-cyan-500 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {dict?.search?.searching || "Pretražujemo Srpske Vode..."}
                </span>
              </div>
            ) : query.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                  {dict?.search?.recent_searches || "Nedavne Pretrage"}
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-4">
                  {(dict?.search?.recent_chips || ['Petroland', 'Beograd', 'Porodične Akcije']).map((s: string) => (
                    <button 
                      key={s} 
                      onClick={() => setQuery(s)}
                      className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase hover:bg-cyan-500 hover:text-navy-deep transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1" aria-live="polite">
                {results.map((result, i) => (
                  <button
                    key={result.id}
                    onClick={() => router.push(result.href)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 group transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                        {result.type === 'facility' ? <Icon name="location_on" className="text-[20px] text-cyan-400" /> : <Icon name="confirmation_number" className="text-[20px] text-cyan-400" />}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-black uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{result.title}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{result.subtitle}</div>
                      </div>
                    </div>
                    <Icon name="arrow_forward" className="text-[16px] text-slate-700 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                  {dict?.search?.no_results || "Nema pronađenih iskustava"}
                </p>
              </div>
            )}
        </div>

        <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                 <kbd className="px-2 py-1 rounded bg-slate-800 text-[9px] font-black text-slate-400 border border-white/5">ESC</kbd>
                 <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                   {dict?.search?.to_close || "za zatvaranje"}
                 </span>
              </div>
              <div className="flex items-center gap-1.5">
                 <kbd className="px-2 py-1 rounded bg-slate-800 text-[9px] font-black text-slate-400 border border-white/5">↵</kbd>
                 <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                   {dict?.search?.to_select || "za odabir"}
                 </span>
              </div>
           </div>
           <span className="text-[9px] font-black text-cyan-500/50 uppercase tracking-[0.2em]">
             {dict?.search?.brand_tag || "Splash Otkrivanje v2.0"}
           </span>
        </div>
      </div>
    </div>
  )
}
