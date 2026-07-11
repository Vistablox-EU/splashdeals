"use client";
import { Icon } from "@/components/ui/Icon";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getClientDictionary } from "@/lib/client-dictionaries";
import type { Dict } from "@/lib/types";

/**
 * 🔍 Global Search Command Palette
 * High-performance search interface designed for Parallel/Intercepting routing.
 */
export function GlobalSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams ? searchParams.get("q") || "" : "";

  const [prevQ, setPrevQ] = React.useState(q);
  const [query, setQuery] = React.useState(q);
  const [results, setResults] = React.useState<Dict[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [dict, setDict] = React.useState<Dict | null>(null);

  React.useEffect(() => {
    getClientDictionary().then(setDict);
  }, []);

  // Synchronize state when URL parameters change (e.g. clicking links while on /search page)
  if (q !== prevQ) {
    setPrevQ(q);
    setQuery(q);
  }

  // Adjust results during render (Prevents cascading effect renders)
  if (query.length < 2 && results.length > 0) {
    setResults([]);
  }

  // Close search and go back
  const handleClose = () => router.back();

  // Simulate search logic (will connect to API later)
  React.useEffect(() => {
    if (query.length < 2) return;

    const delay = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${query}`);
        const data = await res.json();
        setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center px-4 pt-[15vh]">
      {/* 🌑 Backdrop */}
      <div onClick={handleClose} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />

      {/* ⌨️ Search Palette */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-cyan-500/10">
        <div className="relative border-b border-white/5 p-6">
          <Icon
            name="search"
            className="absolute top-1/2 left-10 -translate-y-1/2 text-[20px] text-cyan-500"
          />
          <label htmlFor="global-search" className="sr-only">
            {(dict as Dict)?.search?.sr_label || "Pretražite akva parkove, gradove ili akcije"}
          </label>
          <Input
            id="global-search"
            autoFocus
            placeholder={
              dict?.search?.placeholder || "Pretražite akva parkove, gradove ili akcije..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 w-full border-none bg-white/5 pr-12 pl-14 text-lg font-bold placeholder:text-slate-500 focus-visible:ring-0"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-1/2 right-8 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <Icon name="close" className="text-[20px]" />
          </Button>
        </div>

        <div className="custom-scrollbar max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20" aria-busy="true">
              <Icon name="progress_activity" className="animate-spin text-[32px] text-cyan-500" />
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                {dict?.search?.searching || "Pretražujemo Srpske Vode..."}
              </span>
            </div>
          ) : query.length === 0 ? (
            <div className="space-y-2 p-8 text-center">
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                {dict?.search?.recent_searches || "Nedavne Pretrage"}
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {(dict?.search?.recent_chips || ["Petroland", "Beograd", "Porodične Akcije"]).map(
                  (s: string) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="hover:text-navy-deep rounded-full border border-white/5 bg-white/5 px-4 py-3 text-[10px] font-black uppercase transition-all hover:bg-cyan-500 min-h-[44px]"
                    >
                      {s}
                    </button>
                  ),
                )}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1" aria-live="polite">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => router.push(result.href)}
                  className="group flex w-full items-center justify-between rounded-2xl p-4 transition-colors hover:bg-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 transition-colors group-hover:bg-cyan-500/20">
                      {result.type === "facility" ? (
                        <Icon name="location_on" className="text-[20px] text-cyan-400" />
                      ) : (
                        <Icon name="confirmation_number" className="text-[20px] text-cyan-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-black tracking-tight uppercase transition-colors group-hover:text-cyan-400">
                        {result.title}
                      </div>
                      <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                        {result.subtitle}
                      </div>
                    </div>
                  </div>
                  <Icon
                    name="arrow_forward"
                    className="text-[16px] text-slate-700 transition-all group-hover:translate-x-1 group-hover:text-cyan-400"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-xs font-black tracking-widest text-slate-500 uppercase">
                {dict?.search?.no_results || "Nema pronađenih iskustava"}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 bg-black/20 p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <kbd className="rounded border border-white/5 bg-slate-800 px-2 py-1 text-[9px] font-black text-slate-400">
                ESC
              </kbd>
              <span className="text-[9px] font-bold tracking-widest text-slate-600 uppercase">
                {dict?.search?.to_close || "za zatvaranje"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="rounded border border-white/5 bg-slate-800 px-2 py-1 text-[9px] font-black text-slate-400">
                ↵
              </kbd>
              <span className="text-[9px] font-bold tracking-widest text-slate-600 uppercase">
                {dict?.search?.to_select || "za odabir"}
              </span>
            </div>
          </div>
          <span className="text-[9px] font-black tracking-[0.2em] text-cyan-500/50 uppercase">
            {dict?.search?.brand_tag || "Splash Otkrivanje v2.0"}
          </span>
        </div>
      </div>
    </div>
  );
}
