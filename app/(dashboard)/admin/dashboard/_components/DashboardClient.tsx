"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import { ChartAreaInteractive } from "@/app/(dashboard)/admin/_common/chart-area-interactive"
import { SectionCards } from "@/components/shared/section-cards"

interface RecentActivity {
  id: string
  totalAmount: number
  status: string
  createdAt: string | Date
  city: string
}

interface DashboardStats {
  totalRevenue: number
  activeFacilities: number
  totalCustomers: number
  activeTickets: number
}

export function DashboardClient({ stats, recentActivity }: { stats: DashboardStats; recentActivity?: RecentActivity[] }) {

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 bg-background" aria-label="Admin Dashboard Overview">
      <div className="@container/main flex flex-1 flex-col gap-4 w-full">
        <h1 className="sr-only">Splashdeals Admin Dashboard Overview</h1>
        
        <SectionCards stats={stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <ChartAreaInteractive />
          </div>
          
          <div className="rounded-lg border border-border/50 bg-muted/20 p-5 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <Icon name="monitor_heart" className="size-3.5 text-cyan-400" />
                Puls aktivnosti
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <div className="h-1 w-1 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[9px] font-black text-cyan-500 uppercase tracking-tight">Uživo</span>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((act) => (
                  <div key={act.id} className="group relative flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-all border border-transparent hover:border-border/50">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] shrink-0" />
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-foreground tracking-tight font-mono">{act.totalAmount.toLocaleString()} RSD</span>
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter px-1.5 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10">
                          {act.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                        <span className="text-cyan-400/60 font-mono">@{act.city}</span>
                        <span>•</span>
                        <span className="font-mono">{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 gap-4 text-center h-full">
                  <div className="relative">
                    <Icon name="monitor_heart" className="size-8 text-muted-foreground/40" />
                    <div className="absolute inset-0 h-8 w-8 text-cyan-500/20 animate-ping" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tok miruje</h3>
                    <p className="text-[9px] font-bold text-muted-foreground/80 uppercase leading-relaxed">
                      Nema transakcija u poslednjem satu.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border/50 space-y-3">
              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Status sistema</div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/10 border border-border/50">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Gateway</span>
                <span className="text-[9px] font-mono text-emerald-400 uppercase">Na mreži</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/10 border border-border/50">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Okruženje</span>
                <span className="text-[9px] font-mono text-cyan-400 uppercase">SD-2026-BETA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-8 rounded-xl border border-dashed border-border bg-muted/5 flex flex-col items-center justify-center text-center gap-3">
          <Icon name="database" className="size-6 text-muted-foreground/40" />
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Operativni red</h3>
            <p className="text-[10px] font-bold text-muted-foreground/80 uppercase">
              Stvarni operativni pogon sinhronizovan je sa primarnim čvorom.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
              Primarni čvor
            </div>
            <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black text-cyan-500 uppercase tracking-widest">
              v2.4.1
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
