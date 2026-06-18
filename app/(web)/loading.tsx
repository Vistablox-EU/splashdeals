import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton"

/**
 * 🌊 Web Loading Boundary (Next.js 16 + Tailwind v4)
 * Provides a high-fidelity glassmorphic skeleton that eliminates CLS and layout shifts
 * while the Partial Prerendering (PPR) stream completes.
 *
 * ⚠️ SEO NOTE: Do NOT export `metadata` or any robots directives from loading.tsx.
 * Doing so leaks a noindex signal into the initial streaming payload before the real
 * page content arrives, which causes Googlebot to bail on indexing the page.
 */

export default function WebLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start overflow-hidden selection:bg-primary/30">
      {/* 🔮 BACKGROUND: Glassmorphism & Depth */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Animated Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        
        {/* Branded Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* 🌊 CENTRAL LOADER: Pulsing Branded Icon */}
      <div className="relative mt-32 mb-20 flex flex-col items-center">
        <div className="absolute inset-0 bg-primary/20 blur-[60px] animate-pulse rounded-full" />
        <div className="p-5 rounded-3xl bg-muted/50 border border-border backdrop-blur-xl shadow-2xl relative z-10 animate-float">
          <Icon name="waves" className="text-[48px] text-primary animate-pulse" />
        </div>
        <div className="mt-6 flex flex-col items-center gap-2">
          <span className="text-primary/50 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
            Loading Experience
          </span>
          <div className="flex gap-1">
             <div className="h-1 w-1 rounded-full bg-primary/40 animate-bounce" />
             <div className="h-1 w-1 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
             <div className="h-1 w-1 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      </div>

      {/* 🏗️ SKELETON MOCKUP: Mirroring the Layout */}
      <main className="w-full max-w-7xl mx-auto px-6 space-y-24 relative z-20 pb-32">
        
        {/* Hero Area Skeleton */}
        <div className="flex flex-col items-center text-center space-y-10">
          <Skeleton className="h-10 w-56 rounded-full bg-muted border border-border shadow-inner" />
          <div className="space-y-6">
            <Skeleton className="h-20 sm:h-28 w-[320px] sm:w-[900px] rounded-[2rem] bg-muted" />
            <Skeleton className="h-20 sm:h-28 w-[280px] sm:w-[700px] mx-auto rounded-[2rem] bg-muted" />
          </div>
          <Skeleton className="h-6 w-[220px] sm:w-[450px] rounded-xl bg-muted" />
          <div className="flex flex-wrap justify-center gap-5 pt-4">
            <Skeleton className="h-16 w-48 rounded-2xl bg-muted shadow-lg" />
            <Skeleton className="h-16 w-48 rounded-2xl bg-muted shadow-lg" />
          </div>
        </div>

        {/* Categories/Discovery Hub Skeleton */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-4">
              <Skeleton className="h-12 w-80 bg-muted rounded-2xl" />
              <Skeleton className="h-4 w-56 bg-muted rounded-lg" />
            </div>
            <Skeleton className="h-12 w-40 bg-muted rounded-xl" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-36 rounded-3xl bg-muted border border-border hover:border-primary/20 transition-colors" />
            ))}
          </div>
        </div>

        {/* Main Facility Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[3rem] bg-muted/10 border border-border p-8 space-y-8 overflow-hidden relative group">
              <Skeleton className="h-72 w-full rounded-[2rem] bg-muted shadow-2xl" />
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                   <Skeleton className="h-10 w-3/4 bg-muted rounded-xl" />
                   <Skeleton className="h-6 w-16 bg-muted rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-muted rounded-lg" />
                  <Skeleton className="h-4 w-5/6 bg-muted rounded-lg" />
                  <Skeleton className="h-4 w-4/6 bg-muted rounded-lg" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-border">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16 bg-muted rounded-full" />
                  <Skeleton className="h-8 w-28 bg-muted rounded-xl" />
                </div>
                <Skeleton className="h-14 w-14 bg-muted rounded-3xl shadow-xl" />
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
