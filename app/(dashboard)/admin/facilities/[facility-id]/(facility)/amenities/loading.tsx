import { Skeleton } from "@/components/ui/skeleton";
import { GlassCard } from "@/components/ui/GlassCard";

export default function AmenitiesLoading() {
  return (
    <GlassCard className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl p-6 space-y-6 shadow-2xl relative overflow-hidden animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full max-w-md h-9 bg-slate-950/40 rounded-lg border border-white/5" />
        <div className="flex items-center gap-3">
          <div className="h-4 w-28 bg-slate-800 rounded" />
          <div className="h-6 w-10 bg-slate-800 rounded-full" />
        </div>
      </div>
      <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-950/20">
        <div className="divide-y divide-white/5">
          <div className="grid grid-cols-6 gap-4 p-4 bg-slate-950/60 border-b border-white/5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-3 w-16 bg-slate-800 rounded" />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="grid grid-cols-6 gap-4 p-4 items-center">
              <div className="h-6 w-10 bg-slate-900 rounded-full" />
              <div className="h-4 w-32 bg-slate-900 rounded" />
              <div className="h-5 w-16 bg-slate-900 rounded-full" />
              <div className="h-8 w-36 bg-slate-900 rounded-lg" />
              <div className="h-5 w-5 bg-slate-900 rounded mx-auto" />
              <div className="h-6 w-6 bg-slate-900 rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
