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
      <section className="bg-muted/40 relative flex h-[60vh] w-full flex-col justify-end overflow-hidden p-6 md:min-h-[calc(100dvh-104px)] md:p-12">
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
            <div className="border-border rounded-2xl border-2 p-6 sm:p-12 md:p-16">
              <div className="mb-6">
                <Skeleton className="bg-muted h-4 w-32 rounded" />
              </div>
              <Skeleton className="bg-muted mb-6 h-6 w-48 rounded-lg" />
              <Skeleton className="bg-muted mb-2 h-4 w-full rounded" />
              <Skeleton className="bg-muted mb-2 h-4 w-3/4 rounded" />
              <Skeleton className="bg-muted h-4 w-5/6 rounded" />
            </div>
          </div>
          <aside className="lg:col-span-4">
            <div className="space-y-6">
              {/* PartnerBranding skeleton */}
              <div className="border-border glass-frost flex items-center gap-5 rounded-[2rem] border p-6">
                <Skeleton className="bg-muted h-24 w-24 shrink-0 rounded-3xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="bg-muted h-3 w-24 rounded" />
                  <Skeleton className="bg-muted h-5 w-32 rounded" />
                </div>
              </div>
              {/* OperationalPortal skeleton */}
              <div className="border-border bg-muted/20 rounded-[3rem] border p-10">
                <Skeleton className="bg-muted mb-6 h-8 w-48 rounded-lg" />
                <div className="space-y-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl p-2.5">
                      <Skeleton className="bg-muted h-4 w-16 rounded" />
                      <Skeleton className="bg-muted h-4 w-24 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
