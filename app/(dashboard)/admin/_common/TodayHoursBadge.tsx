"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface OpeningHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface TodayHoursBadgeProps {
  hours: OpeningHours[];
}

/**
 * ⏰ TodayHoursBadge Island (Client)
 * Evaluates the current day of the week based on the browser's timezone.
 */
export function TodayHoursBadge({ hours }: TodayHoursBadgeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const today = new Date().getDay();
  const todayHours = hours.find((h) => h.dayOfWeek === today);

  if (!mounted) {
    return (
      <div className="h-9 w-32 bg-muted/30 animate-pulse rounded-lg" />
    );
  }

  return (
    <div className="flex items-center gap-3 bg-muted/30 border border-border/50 rounded-xl px-4 py-2 backdrop-blur-md">
       <div className="flex flex-col">
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Current Status</p>
          <div className="flex items-center gap-1.5">
             <div className={cn("size-1.5 rounded-full animate-pulse shadow-[0_0_8px]", todayHours?.isClosed ? "bg-red-500 shadow-red-500/50" : "bg-emerald-500 shadow-emerald-500/50")} />
             <span className={cn("text-xs font-black uppercase tracking-widest", todayHours?.isClosed ? "text-red-400" : "text-emerald-400")}>
                {todayHours?.isClosed ? "Closed" : "Operational"}
             </span>
          </div>
       </div>
       
       <div className="h-6 w-px bg-muted/50 mx-1" />

       <div className="flex flex-col">
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Window</p>
          <p className="text-xs font-bold text-foreground tabular-nums tracking-tighter">
             {todayHours && !todayHours.isClosed ? (
                `${todayHours.openTime} — ${todayHours.closeTime}`
             ) : (
                "NA"
             )}
          </p>
       </div>
    </div>
  );
}
