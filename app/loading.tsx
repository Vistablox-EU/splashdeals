import { Icon } from "@/components/ui/Icon";

/**
 * 🌊 Root Loading Boundary
 * Minimal centered loading state for the root route group.
 * Renders inside the root layout (app/layout.tsx).
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-full bg-cyan-500/20 blur-[60px]" />
          <div className="border-border/20 relative rounded-3xl border p-5 backdrop-blur-xl">
            <Icon name="waves" className="animate-pulse text-[48px] text-cyan-400" />
          </div>
        </div>
        <span className="animate-pulse text-[10px] font-black tracking-[0.5em] text-cyan-400/50 uppercase">
          Loading Experience
        </span>
        <div className="flex gap-1.5">
          <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400/60" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400/60 [animation-delay:0.2s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400/60 [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}
