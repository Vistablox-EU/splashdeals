"use client";
import { Icon } from "@/components/ui/Icon";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatTime24h, DAYS_SR } from "@/lib/utils/date-time";

import type { OperatingHours } from "@prisma/client";

interface OperationalPortalProps {
  hours: OperatingHours[];
}

/**
 * ⏰ OperationalPortal Island (Client)
 * Handles client-side date-time calculations to avoid SSG/SSR hydration mismatches.
 * Uses shared utilities for consistent 24h notation.
 */
export function OperationalPortal({ hours = [] }: OperationalPortalProps) {
  const [todayIdx, setTodayIdx] = useState<number | null>(null);

  useEffect(() => {
    // Ensure this calculation only runs on the client to avoid Next.js time-errors
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayIdx(new Date().getDay());
  }, []);

  return (
    <Card className="p-10 border-border bg-gradient-to-br from-muted/50 to-transparent rounded-[3rem]">
      <h3 className="text-xl md:text-3xl font-black mb-6 flex items-center gap-4 text-foreground uppercase tracking-tighter italic">
        <Icon name="schedule" className="text-[24px] text-primary" /> Radno Vreme
      </h3>
      <div className="space-y-1">
        {hours?.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((h: OperatingHours) => (
          <div key={h.id} className={cn(
            "flex items-center justify-between p-2.5 rounded-2xl transition-all",
            h.dayOfWeek === todayIdx ? "bg-primary/10 border border-primary/20 text-foreground font-black" : "text-muted-foreground opacity-60 font-bold"
          )}>
            <span className="text-[10px] uppercase tracking-widest">{DAYS_SR[h.dayOfWeek]}</span>
            <span className="text-sm font-mono tracking-tight">
              {h.isClosed ? (
                <span className="text-red-400">Zatvoreno</span>
              ) : (
                <>
                  <time dateTime={h.openTime}>{formatTime24h(h.openTime)}</time> – <time dateTime={h.closeTime}>{formatTime24h(h.closeTime)}</time>
                </>
              )}
            </span>
          </div>
        ))}
        {!hours?.length && <p className="text-muted-foreground italic text-center py-4">Raspored dostupan na licu mesta.</p>}
      </div>

    </Card>
  );
}

/**
 * 🕓 CurrentOperationalStatus Island (Client)
 */
export function CurrentOperationalStatus({ hours = [] }: { hours: OperatingHours[] }) {
  const [status, setStatus] = useState<OperatingHours | null>(null);

  useEffect(() => {
    const todayId = new Date().getDay();
    const todayHours = hours?.find?.(h => h.dayOfWeek === todayId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (todayHours) setStatus(todayHours);
  }, [hours]);

  if (!status) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-5 py-2.5 rounded-2xl backdrop-blur-md border transition-all",
      status.isClosed ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    )}>
       <Icon name="schedule" className="text-[16px]" />
       <span className="text-xs font-black uppercase tracking-widest font-mono">
          {status.isClosed ? (
             'Zatvoreno Danas'
          ) : (
             <>
                <time dateTime={status.openTime}>{formatTime24h(status.openTime)}</time> – <time dateTime={status.closeTime}>{formatTime24h(status.closeTime)}</time>
             </>
          )}
       </span>
    </div>
  );
}
