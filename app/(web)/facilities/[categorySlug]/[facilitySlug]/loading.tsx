import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

/**
 * 🌊 AquastreamUI Skeleton Shell
 *
 * ⚠️ SEO NOTE: Do NOT export `metadata` or any robots directives from loading.tsx.
 * Doing so leaks a noindex signal into the streaming payload before the real page
 * content arrives, causing Googlebot to bail on indexing.
 */
export default function FacilityLoading() {
  return (
    <div className="relative bg-background min-h-screen text-foreground selection:bg-primary/30 font-sans overflow-x-hidden">
      {/* 🏙️ HERO SKELETON */}
      <section className="relative h-[90vh] md:h-screen w-full flex flex-col justify-end p-6 md:p-12 overflow-hidden bg-muted/40">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
           <Icon name="waves" className="w-48 h-48 text-primary animate-pulse" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-12">
           <div className="md:col-span-8 space-y-6">
             <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-full bg-muted" />
                <Skeleton className="h-8 w-24 rounded-full bg-muted" />
             </div>
             <Skeleton className="h-24 w-[80%] bg-muted rounded-3xl" />
             <div className="flex gap-4">
                <Skeleton className="h-10 w-40 bg-muted rounded-2xl" />
                <Skeleton className="h-10 w-40 bg-muted rounded-2xl" />
             </div>
           </div>
           <div className="md:col-span-4">
              <Card className="p-4 border-border bg-muted">
                 <div className="flex gap-2">
                    <Skeleton className="h-20 w-32 rounded-xl bg-muted" />
                    <Skeleton className="h-20 w-32 rounded-xl bg-muted" />
                    <Skeleton className="h-20 w-32 rounded-xl bg-muted" />
                 </div>
              </Card>
           </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 md:px-12 -mt-12 relative z-20 space-y-24 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
           <div className="lg:col-span-8 space-y-12">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {[1,2,3,4].map(i => (
                   <Skeleton key={i} className="h-32 bg-muted rounded-[2rem]" />
                 ))}
              </div>
           </div>
           <aside className="lg:col-span-4">
              <Skeleton className="h-[400px] w-full bg-muted rounded-[2rem]" />
           </aside>
        </div>
      </main>

    </div>
  )
}
