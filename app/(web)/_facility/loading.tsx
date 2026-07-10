import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * 🌊 AquastreamUI Skeleton Shell
 *
 * ⚠️ SEO NOTE: Do NOT export `metadata` or any robots directives from loading.tsx.
 * Doing so leaks a noindex signal into the streaming payload before the real page
 * content arrives, causing Googlebot to bail on indexing.
 */
export default function FacilityLoading() {
  return (
    <div className="bg-background text-foreground selection:bg-primary/30 relative min-h-screen overflow-x-hidden font-sans">
      {/* 🏙️ HERO SKELETON */}
      <section className="bg-muted/40 relative flex h-[90vh] w-full flex-col justify-end overflow-hidden p-6 md:min-h-[calc(100dvh-104px)] md:p-12">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Icon name="waves" className="text-primary h-48 w-48 animate-pulse" />
        </div>

        <div className="relative z-10 mx-auto mb-12 grid w-full max-w-7xl grid-cols-1 items-end gap-8 md:grid-cols-12">
          <div className="space-y-6 md:col-span-8">
            <div className="flex gap-2">
              <Skeleton className="bg-muted h-8 w-24 rounded-full" />
              <Skeleton className="bg-muted h-8 w-24 rounded-full" />
            </div>
            <Skeleton className="bg-muted h-24 w-[80%] rounded-3xl" />
            <div className="flex gap-4">
              <Skeleton className="bg-muted h-10 w-40 rounded-2xl" />
              <Skeleton className="bg-muted h-10 w-40 rounded-2xl" />
            </div>
          </div>
          <div className="md:col-span-4">
            <Card className="border-border bg-muted p-4">
              <div className="flex gap-2">
                <Skeleton className="bg-muted h-20 w-32 rounded-xl" />
                <Skeleton className="bg-muted h-20 w-32 rounded-xl" />
                <Skeleton className="bg-muted h-20 w-32 rounded-xl" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      <main className="relative z-20 mx-auto -mt-12 max-w-7xl space-y-24 px-6 pb-32 md:px-12">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          <div className="space-y-12 lg:col-span-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="bg-muted h-32 rounded-[2rem]" />
              ))}
            </div>
          </div>
          <aside className="lg:col-span-4">
            <Skeleton className="bg-muted h-[400px] w-full rounded-[2rem]" />
          </aside>
        </div>
      </main>
    </div>
  );
}
