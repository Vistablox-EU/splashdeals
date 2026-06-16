"use client"
import { Icon } from "@/components/ui/Icon";

import * as React from "react"
import { GroupPanel } from "./group-panel"
import { TicketPanel } from "./ticket-panel"
import { SerializedAdminTicket, SerializedTicketGroup } from "./columns"
import { cn } from "@/lib/utils"

interface TicketManagementProps {
  facilityId: string
  initialTickets: SerializedAdminTicket[]
  initialGroups: SerializedTicketGroup[]
  facilityStatus: string
}

export function TicketManagement({
  facilityId,
  initialTickets,
  initialGroups,
  facilityStatus,
}: TicketManagementProps) {
  const [activeGroupId, setActiveGroupId] = React.useState<string>("ALL")

  // For mobile: toggle between groups panel and tickets panel
  const [mobileView, setMobileView] = React.useState<"groups" | "tickets">("tickets")

  const activeGroup = React.useMemo(
    () => initialGroups.find((g) => g.id === activeGroupId) ?? null,
    [initialGroups, activeGroupId]
  )

  const ticketGroupsForSheet = React.useMemo(
    () => initialGroups.map((g) => ({ id: g.id, title: g.title })),
    [initialGroups]
  )

  const handleGroupSelect = (id: string) => {
    setActiveGroupId(id)
    // On mobile, auto-switch to tickets view when a group is selected
    setMobileView("tickets")
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Mobile Tab Toggle (visible only on <lg) ─────────────────────────── */}
      <div className="flex lg:hidden items-center gap-1 p-3 border-b border-white/5 bg-slate-950/60 backdrop-blur-md shrink-0">
        <button
          onClick={() => setMobileView("groups")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            mobileView === "groups"
              ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
              : "bg-white/[0.02] border border-white/5 text-slate-500 hover:text-slate-300"
          )}
        >
          <Icon name="dashboard" className="text-[14px]" />
          Grupe ({initialGroups.length})
        </button>
        <button
          onClick={() => setMobileView("tickets")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            mobileView === "tickets"
              ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
              : "bg-white/[0.02] border border-white/5 text-slate-500 hover:text-slate-300"
          )}
        >
          <Icon name="confirmation_number" className="text-[14px]" />
          Ulaznice ({initialTickets.length})
        </button>
      </div>

      {/* ── Split Panel (lg+) / Single Panel (mobile) ───────────────────────── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left: Groups Panel */}
        <div
          className={cn(
            // Desktop: always visible fixed-width sidebar
            "lg:flex lg:w-72 xl:w-80 lg:flex-col lg:shrink-0 lg:border-r lg:border-white/5",
            // Mobile: conditionally visible
            mobileView === "groups" ? "flex flex-col flex-1" : "hidden"
          )}
        >
          <GroupPanel
            facilityId={facilityId}
            initialGroups={initialGroups}
            activeGroupId={activeGroupId}
            onGroupSelect={handleGroupSelect}
          />
        </div>

        {/* Right: Tickets Panel */}
        <div
          className={cn(
            // Desktop: always visible, takes remaining space
            "lg:flex lg:flex-col lg:flex-1 lg:min-w-0",
            // Mobile: conditionally visible
            mobileView === "tickets" ? "flex flex-col flex-1" : "hidden"
          )}
        >
          <TicketPanel
            facilityId={facilityId}
            initialTickets={initialTickets}
            ticketGroups={ticketGroupsForSheet}
            facilityStatus={facilityStatus}
            activeGroupId={activeGroupId}
            activeGroup={activeGroup}
          />
        </div>
      </div>
    </div>
  )
}
